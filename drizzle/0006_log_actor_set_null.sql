-- Deleting a login sets actor_profile_id to null on the logs (ON DELETE SET NULL).
-- That's an UPDATE, which the append-only trigger refused, so no login with log
-- rows could be deleted. Allow exactly that cascade: the actor cleared, nothing else.

CREATE OR REPLACE FUNCTION private.forbid_log_change() RETURNS trigger
LANGUAGE plpgsql SET search_path = '' AS $$
BEGIN
  IF TG_OP = 'DELETE' AND pg_trigger_depth() > 1 THEN
    RETURN OLD;
  END IF;
  IF TG_OP = 'UPDATE' AND pg_trigger_depth() > 1
     AND OLD.actor_profile_id IS NOT NULL AND NEW.actor_profile_id IS NULL
     AND (to_jsonb(NEW) - 'actor_profile_id') = (to_jsonb(OLD) - 'actor_profile_id') THEN
    RETURN NEW;
  END IF;
  RAISE EXCEPTION '% is append-only', TG_TABLE_NAME;
END;
$$;
