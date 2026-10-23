-- Students could see their own consultation but not the time it's at, because
-- consultation_slots was readable by admins only. Let a student read the slots
-- they have booked (and nothing else); open times are served by the server.

CREATE OR REPLACE FUNCTION private.my_booked_slot_ids() RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' AS $$
  SELECT slot_id FROM public.consultations WHERE student_id = private.my_student_id()
$$;
--> statement-breakpoint
GRANT EXECUTE ON FUNCTION private.my_booked_slot_ids() TO authenticated;
--> statement-breakpoint
CREATE POLICY "consultation_slots: own booking" ON public.consultation_slots FOR SELECT TO authenticated
  USING (id IN (SELECT private.my_booked_slot_ids()));
