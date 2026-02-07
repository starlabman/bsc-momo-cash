
-- Enable pg_cron and pg_net extensions for scheduled blockchain monitoring
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Schedule blockchain monitor to run every minute
SELECT cron.schedule(
  'blockchain-monitor-poll',
  '* * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://xusensadnrsodukuzndm.supabase.co/functions/v1/blockchain-monitor',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh1c2Vuc2FkbnJzb2R1a3V6bmRtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMzNzAyNjUsImV4cCI6MjA2ODk0NjI2NX0.ulVZWdmbQzW6_fNRT19dAmS8x7-QW9L5rrD6fY0UdEk"}'::jsonb,
        body:=concat('{"time": "', now(), '"}')::jsonb
    ) as request_id;
  $$
);
