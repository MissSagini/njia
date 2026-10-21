-- 2FA was dropped: mentors and admins log in with email and password only,
-- so access no longer depends on the session's assurance level (aal2).

CREATE OR REPLACE FUNCTION private.is_admin() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
$$;
--> statement-breakpoint
CREATE OR REPLACE FUNCTION private.my_mentor_id() RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT id FROM public.mentors WHERE profile_id = auth.uid()
$$;
--> statement-breakpoint
DROP POLICY "mentors: self, own students' mentor or admin" ON public.mentors;
--> statement-breakpoint
CREATE POLICY "mentors: self, own students' mentor or admin" ON public.mentors FOR SELECT TO authenticated
  USING (
    profile_id = (SELECT auth.uid())
    OR (approved AND id IN (SELECT private.my_mentor_ids_as_student()))
    OR (SELECT private.is_admin())
  );
--> statement-breakpoint
DROP FUNCTION private.has_aal2();
