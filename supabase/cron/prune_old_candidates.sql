-- Programa la limpieza diaria de candidaturas con mas de 2 anos.
-- Antes de ejecutar este script:
-- 1. Despliega la Edge Function "prune-old-candidates"
-- 2. Guarda en Vault el project URL y una clave con permisos para invocar la funcion
-- 3. Ajusta los nombres de los secretos si quieres usar otros

select vault.create_secret('https://TU-PROYECTO.supabase.co', 'project_url')
where not exists (
  select 1 from vault.decrypted_secrets where name = 'project_url'
);

select vault.create_secret('TU_SERVICE_ROLE_KEY', 'service_role_key')
where not exists (
  select 1 from vault.decrypted_secrets where name = 'service_role_key'
);

select
  cron.schedule(
    'prune-old-candidates-daily',
    '0 3 * * *',
    $$
    select
      net.http_post(
        url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url')
          || '/functions/v1/prune-old-candidates',
        headers := jsonb_build_object(
          'Content-type', 'application/json',
          'Authorization', 'Bearer ' || (
            select decrypted_secret from vault.decrypted_secrets where name = 'service_role_key'
          )
        ),
        body := jsonb_build_object('trigger', 'cron')
      ) as request_id;
    $$
  );
