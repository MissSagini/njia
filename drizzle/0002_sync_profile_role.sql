-- Supabase sets app_metadata (and so the role) in an UPDATE after creating
-- the auth user, so the insert trigger alone saw no role. Keep profiles.role,
-- email and name in step with the auth user whenever they change.

CREATE OR REPLACE FUNCTION private.sync_profile_from_user() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = '' AS $$
BEGIN
  UPDATE public.profiles SET
    role = coalesce((NEW.raw_app_meta_data ->> 'role')::public.user_role, role),
    email = NEW.email,
    full_name = coalesce(NEW.raw_user_meta_data ->> 'full_name', full_name),
    updated_at = now()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE OF raw_app_meta_data, raw_user_meta_data, email ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.sync_profile_from_user();
--> statement-breakpoint
-- Fix profiles created before this trigger existed
UPDATE public.profiles p SET role = (u.raw_app_meta_data ->> 'role')::public.user_role, updated_at = now()
FROM auth.users u
WHERE u.id = p.id
  AND u.raw_app_meta_data ->> 'role' IN ('student', 'mentor', 'admin')
  AND p.role::text <> u.raw_app_meta_data ->> 'role';
