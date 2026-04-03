
-- Fix create_admin_jwt: add search_path
CREATE OR REPLACE FUNCTION public.create_admin_jwt(p_admin_id uuid, p_username text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  RETURN json_build_object(
    'admin_id', p_admin_id,
    'username', p_username,
    'issued_at', floor(extract(epoch from now()))::bigint,
    'expires_at', floor(extract(epoch from now() + interval '15 minutes'))::bigint,
    'token_type', 'admin_access'
  )::text;
END;
$function$;

-- Fix generate_transaction_reference: add pg_temp
CREATE OR REPLACE FUNCTION public.generate_transaction_reference(prefix text DEFAULT 'SIK'::text)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE
  new_ref TEXT;
  exists_check BOOLEAN := TRUE;
  attempts INT := 0;
BEGIN
  WHILE exists_check AND attempts < 10 LOOP
    new_ref := prefix || '-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    SELECT EXISTS(
      SELECT 1 FROM offramp_requests WHERE reference_id = new_ref
      UNION ALL
      SELECT 1 FROM onramp_requests WHERE reference_id = new_ref
    ) INTO exists_check;
    attempts := attempts + 1;
  END LOOP;
  RETURN new_ref;
END;
$function$;

-- Fix set_offramp_reference
CREATE OR REPLACE FUNCTION public.set_offramp_reference()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.reference_id IS NULL THEN
    NEW.reference_id := generate_transaction_reference('OFF');
  END IF;
  RETURN NEW;
END;
$function$;

-- Fix set_onramp_reference
CREATE OR REPLACE FUNCTION public.set_onramp_reference()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'pg_temp'
AS $function$
BEGIN
  IF NEW.reference_id IS NULL THEN
    NEW.reference_id := generate_transaction_reference('ONR');
  END IF;
  RETURN NEW;
END;
$function$;
