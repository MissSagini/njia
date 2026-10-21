-- Security layer: helper functions, profile trigger, read policies, grants,
-- append-only audit logs, and the programme weeks seed.
--
-- Model: the app reads through Drizzle inside a transaction that runs as the
-- signed-in user (role "authenticated" + their JWT claims), so these policies
-- apply to every read. Writes go through server code that checks permissions
-- first; the browser has no write access to any table.

-- ---------------------------------------------------------------- helpers
-- Kept in a "private" schema, which Supabase does not expose through its API.

CREATE SCHEMA IF NOT EXISTS private;
--> statement-breakpoint
GRANT USAGE ON SCHEMA private TO authenticated;
--> statement-breakpoint

-- Mentors and admins only count as signed in with 2FA (assurance level aal2)
CREATE OR REPLACE FUNCTION private.has_aal2() RETURNS boolean
LANGUAGE sql STABLE SET search_path = '' AS $$
  SELECT coalesce((auth.jwt() ->> 'aal') = 'aal2', false)
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT private.has_aal2() AND EXISTS (
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
  )
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION private.my_student_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id FROM public.students WHERE profile_id = auth.uid()
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION private.my_mentor_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id FROM public.mentors WHERE profile_id = auth.uid() AND private.has_aal2()
$$;
--> statement-breakpoint
-- Students paired with the signed-in mentor
CREATE OR REPLACE FUNCTION private.my_mentee_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT student_id FROM public.enrolments WHERE mentor_id = private.my_mentor_id()
$$;
--> statement-breakpoint
-- Mentors paired with the signed-in student
CREATE OR REPLACE FUNCTION private.my_mentor_ids_as_student() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT mentor_id FROM public.enrolments
  WHERE student_id = private.my_student_id() AND mentor_id IS NOT NULL
$$;
--> statement-breakpoint
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA private TO authenticated;
--> statement-breakpoint

-- ---------------------------------------------------------------- profiles
-- Created automatically with each auth user. The role comes from app_metadata,
-- which only the server (secret key) can set; it defaults to student.

CREATE OR REPLACE FUNCTION private.handle_new_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  INSERT INTO public.profiles (id, role, email, full_name)
  VALUES (
    NEW.id,
    coalesce((NEW.raw_app_meta_data ->> 'role')::public.user_role, 'student'),
    NEW.email,
    NEW.raw_user_meta_data ->> 'full_name'
  );
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.handle_new_user();
--> statement-breakpoint

-- ---------------------------------------------------------------- grants
-- No anonymous access at all. Signed-in users may only SELECT, and only the
-- rows the policies below allow.

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
--> statement-breakpoint
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon, authenticated;
--> statement-breakpoint
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON ALL TABLES IN SCHEMA public FROM authenticated;
--> statement-breakpoint
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
--> statement-breakpoint

-- ---------------------------------------------------------------- read policies

CREATE POLICY "profiles: own or admin" ON public.profiles FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT private.is_admin()));
--> statement-breakpoint
CREATE POLICY "students: self, paired mentor or admin" ON public.students FOR SELECT TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR id IN (SELECT private.my_mentee_ids())
    OR (SELECT private.is_admin())
  );
--> statement-breakpoint
CREATE POLICY "mentors: self, own students' mentor or admin" ON public.mentors FOR SELECT TO authenticated
  USING (
    (profile_id = (SELECT auth.uid()) AND (SELECT private.has_aal2()))
    OR (approved AND id IN (SELECT private.my_mentor_ids_as_student()))
    OR (SELECT private.is_admin())
  );
--> statement-breakpoint
CREATE POLICY "consultation_slots: admin" ON public.consultation_slots FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));
--> statement-breakpoint
CREATE POLICY "consultations: own or admin" ON public.consultations FOR SELECT TO authenticated
  USING (student_id = (SELECT private.my_student_id()) OR (SELECT private.is_admin()));
--> statement-breakpoint
CREATE POLICY "mentor_availability: mentor, their students or admin" ON public.mentor_availability FOR SELECT TO authenticated
  USING (
    mentor_id = (SELECT private.my_mentor_id())
    OR mentor_id IN (SELECT private.my_mentor_ids_as_student())
    OR (SELECT private.is_admin())
  );
--> statement-breakpoint
CREATE POLICY "enrolments: student, mentor or admin" ON public.enrolments FOR SELECT TO authenticated
  USING (
    student_id = (SELECT private.my_student_id())
    OR mentor_id = (SELECT private.my_mentor_id())
    OR (SELECT private.is_admin())
  );
--> statement-breakpoint
-- Money is visible to the student and admins, not mentors
CREATE POLICY "charges: student or admin" ON public.charges FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.enrolments e WHERE e.id = enrolment_id AND e.student_id = (SELECT private.my_student_id()))
    OR (SELECT private.is_admin())
  );
--> statement-breakpoint
CREATE POLICY "payments: student or admin" ON public.payments FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.charges c JOIN public.enrolments e ON e.id = c.enrolment_id
      WHERE c.id = charge_id AND e.student_id = (SELECT private.my_student_id())
    )
    OR (SELECT private.is_admin())
  );
--> statement-breakpoint
CREATE POLICY "programme_weeks: everyone signed in" ON public.programme_weeks FOR SELECT TO authenticated
  USING (true);
--> statement-breakpoint
CREATE POLICY "sessions: student, mentor or admin" ON public.sessions FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.enrolments e WHERE e.id = enrolment_id AND e.student_id = (SELECT private.my_student_id()))
    OR mentor_id = (SELECT private.my_mentor_id())
    OR (SELECT private.is_admin())
  );
--> statement-breakpoint
-- Tasks follow their session's visibility
CREATE POLICY "tasks: visible session" ON public.tasks FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.sessions s WHERE s.id = session_id));
--> statement-breakpoint
CREATE POLICY "activity_log: student, mentor or admin" ON public.activity_log FOR SELECT TO authenticated
  USING (
    student_id = (SELECT private.my_student_id())
    OR student_id IN (SELECT private.my_mentee_ids())
    OR (SELECT private.is_admin())
  );
--> statement-breakpoint
CREATE POLICY "access_log: admin" ON public.access_log FOR SELECT TO authenticated
  USING ((SELECT private.is_admin()));
--> statement-breakpoint

-- ---------------------------------------------------------------- append-only logs
-- Updates are never allowed. Deletes only happen through a cascade, for
-- example when a family asks for a student's data to be erased.

CREATE OR REPLACE FUNCTION private.forbid_log_change() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER activity_log_append_only BEFORE UPDATE OR DELETE ON public.activity_log
  FOR EACH ROW EXECUTE FUNCTION private.forbid_log_change();
--> statement-breakpoint
CREATE TRIGGER access_log_append_only BEFORE UPDATE OR DELETE ON public.access_log
  FOR EACH ROW EXECUTE FUNCTION private.forbid_log_change();
--> statement-breakpoint

-- ---------------------------------------------------------------- seed
-- Draft programme outline. Titles are placeholders for the Njia team to edit.

INSERT INTO public.programme_weeks (week_number, stage, title) VALUES
  (1, 'course_choice', 'Goals and course shortlist'),
  (2, 'course_choice', 'Choosing your universities'),
  (3, 'personal_statement', 'Personal statement: first draft'),
  (4, 'personal_statement', 'Personal statement: second draft'),
  (5, 'personal_statement', 'Personal statement: final draft'),
  (6, 'application', 'References and predicted grades'),
  (7, 'application', 'Submitting your application'),
  (8, 'offers', 'Interviews and admissions tests'),
  (9, 'offers', 'Offers and your firm choice'),
  (10, 'visa', 'Student visa and finances'),
  (11, 'accommodation', 'Accommodation and packing'),
  (12, 'arrival', 'Arrival: bank, SIM, getting around and community');
