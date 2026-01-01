-- Add unique reference columns to both tables
ALTER TABLE public.offramp_requests 
ADD COLUMN IF NOT EXISTS reference_id TEXT UNIQUE;

ALTER TABLE public.onramp_requests 
ADD COLUMN IF NOT EXISTS reference_id TEXT UNIQUE;

-- Create function to generate unique reference ID
CREATE OR REPLACE FUNCTION public.generate_transaction_reference(prefix TEXT DEFAULT 'SIK')
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_ref TEXT;
  exists_check BOOLEAN := TRUE;
  attempts INT := 0;
BEGIN
  WHILE exists_check AND attempts < 10 LOOP
    -- Generate format: SIK-XXXXXX (6 alphanumeric chars)
    new_ref := prefix || '-' || upper(substring(md5(random()::text || clock_timestamp()::text) from 1 for 6));
    
    -- Check if exists in either table
    SELECT EXISTS(
      SELECT 1 FROM offramp_requests WHERE reference_id = new_ref
      UNION ALL
      SELECT 1 FROM onramp_requests WHERE reference_id = new_ref
    ) INTO exists_check;
    
    attempts := attempts + 1;
  END LOOP;
  
  RETURN new_ref;
END;
$$;

-- Create trigger function for offramp
CREATE OR REPLACE FUNCTION public.set_offramp_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_id IS NULL THEN
    NEW.reference_id := generate_transaction_reference('OFF');
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger function for onramp
CREATE OR REPLACE FUNCTION public.set_onramp_reference()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.reference_id IS NULL THEN
    NEW.reference_id := generate_transaction_reference('ONR');
  END IF;
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS trigger_set_offramp_reference ON public.offramp_requests;
CREATE TRIGGER trigger_set_offramp_reference
  BEFORE INSERT ON public.offramp_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_offramp_reference();

DROP TRIGGER IF EXISTS trigger_set_onramp_reference ON public.onramp_requests;
CREATE TRIGGER trigger_set_onramp_reference
  BEFORE INSERT ON public.onramp_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.set_onramp_reference();

-- Generate references for existing records
UPDATE public.offramp_requests 
SET reference_id = generate_transaction_reference('OFF') 
WHERE reference_id IS NULL;

UPDATE public.onramp_requests 
SET reference_id = generate_transaction_reference('ONR') 
WHERE reference_id IS NULL;

-- Make columns NOT NULL after populating
ALTER TABLE public.offramp_requests 
ALTER COLUMN reference_id SET NOT NULL;

ALTER TABLE public.onramp_requests 
ALTER COLUMN reference_id SET NOT NULL;