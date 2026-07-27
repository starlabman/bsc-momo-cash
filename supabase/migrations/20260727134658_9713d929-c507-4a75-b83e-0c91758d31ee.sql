-- Add user_id ownership columns (nullable to preserve anonymous creations)
ALTER TABLE public.onramp_requests
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

ALTER TABLE public.offramp_requests
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_onramp_requests_user_id ON public.onramp_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_offramp_requests_user_id ON public.offramp_requests(user_id);

-- Allow authenticated users to view their own transactions
DROP POLICY IF EXISTS "Users can view their own onramp requests" ON public.onramp_requests;
CREATE POLICY "Users can view their own onramp requests"
  ON public.onramp_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own offramp requests" ON public.offramp_requests;
CREATE POLICY "Users can view their own offramp requests"
  ON public.offramp_requests
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

GRANT SELECT ON public.onramp_requests TO authenticated;
GRANT SELECT ON public.offramp_requests TO authenticated;