-- Broadcast transaction status changes via Realtime so users see instant updates
CREATE OR REPLACE FUNCTION public.broadcast_tx_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    PERFORM realtime.send(
      jsonb_build_object(
        'reference_id', NEW.reference_id,
        'status', NEW.status,
        'type', TG_ARGV[0]
      ),
      'status_update',
      'tx_updates',
      false
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS onramp_status_broadcast ON public.onramp_requests;
CREATE TRIGGER onramp_status_broadcast
AFTER UPDATE OF status ON public.onramp_requests
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_tx_status_change('onramp');

DROP TRIGGER IF EXISTS offramp_status_broadcast ON public.offramp_requests;
CREATE TRIGGER offramp_status_broadcast
AFTER UPDATE OF status ON public.offramp_requests
FOR EACH ROW
EXECUTE FUNCTION public.broadcast_tx_status_change('offramp');