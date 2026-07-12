-- Log de actividad simple: qué admin/staff hizo qué en el panel del tenant.
-- Escritura siempre server-side (API routes con service role, que bypassa
-- RLS igual) — las policies son defensa en profundidad por si algún día se
-- consulta con la anon/authenticated key.

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  actor_email text not null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index if not exists activity_log_tenant_created_idx
  on activity_log (tenant_id, created_at desc);

alter table activity_log enable row level security;

-- Solo admin/superadmin del tenant puede leer el historial.
create policy "tenant admin read activity_log"
on activity_log for select
using (
  tenant_id in (
    select tenant_users.tenant_id from tenant_users
    where tenant_users.user_id = auth.uid()
      and tenant_users.role in ('admin', 'superadmin')
  )
  or exists (
    select 1 from tenant_users
    where tenant_users.user_id = auth.uid()
      and tenant_users.role = 'superadmin'
  )
);

-- Cualquier rol autenticado del tenant (admin/staff) puede insertar su propio
-- registro de actividad — solo vía API route, nunca directo desde el cliente.
create policy "tenant member insert activity_log"
on activity_log for insert
to authenticated
with check (
  tenant_id in (
    select tenant_users.tenant_id from tenant_users
    where tenant_users.user_id = auth.uid()
  )
);
