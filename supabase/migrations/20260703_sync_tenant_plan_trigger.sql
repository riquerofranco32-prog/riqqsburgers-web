-- La tabla tenants tiene un trigger `enforce_plan_immutability` que bloquea
-- cualquier UPDATE directo a tenants.plan hecho a nivel de statement top-level
-- (pg_trigger_depth() = 0), para forzar a que el plan solo cambie a través del
-- sistema de suscripciones. Ese trigger ya existía pero faltaba el trigger
-- complementario que efectivamente propague subscriptions.plan -> tenants.plan
-- desde dentro de otro trigger (profundidad > 0, así el guard lo deja pasar).
create or replace function sync_tenant_plan_from_subscription()
returns trigger
language plpgsql
as $$
begin
  update tenants set plan = new.plan where id = new.tenant_id;
  return new;
end;
$$;

drop trigger if exists sync_tenant_plan on subscriptions;
create trigger sync_tenant_plan
after insert or update of plan on subscriptions
for each row
execute function sync_tenant_plan_from_subscription();
