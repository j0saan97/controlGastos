-- =====================================================
-- Sync diario del Google Sheet a las 03:00 hora de Madrid
-- Ejecutar en Supabase → SQL Editor DESPUÉS de desplegar en Vercel
-- =====================================================

-- 1. Extensiones (o actívalas en Database → Extensions)
create extension if not exists pg_cron;
create extension if not exists pg_net;

-- 2. Secretos en Vault (cambia los valores)
select vault.create_secret('https://TU-APP.vercel.app/api/cron-sync', 'cron_sync_url');
select vault.create_secret('MISMO_VALOR_QUE_CRON_SECRET_EN_VERCEL', 'cron_secret');

-- 3. pg_cron funciona en UTC. Madrid = UTC+1 (invierno) / UTC+2 (verano).
--    Se lanza a la 01:00 y 02:00 UTC y solo llama a Vercel
--    cuando en Madrid son las 03:00 → correcto todo el año.
select cron.schedule(
  'sync-poker-3am-madrid',
  '0 1,2 * * *',
  $job$
  select net.http_get(
    url := (select decrypted_secret from vault.decrypted_secrets where name = 'cron_sync_url'),
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'cron_secret')
    ),
    timeout_milliseconds := 30000
  )
  where extract(hour from now() at time zone 'Europe/Madrid') = 3;
  $job$
);

-- Comprobar:
--   select * from cron.job;
--   select * from cron.job_run_details order by start_time desc limit 5;
--   select status_code, content from net._http_response order by created desc limit 5;
-- Borrar:
--   select cron.unschedule('sync-poker-3am-madrid');
