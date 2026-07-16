-- Asignación automática de sucursal por pedido (cercanía + demanda): hasta
-- ahora cada tenant era 1 sola sucursal implícita (lat/lng/delivery_mode
-- vivían en `tenants`). Esta migración introduce `branches` como entidad
-- propia y migra los datos existentes de cada tenant a su primera sucursal,
-- sin perder la config de delivery ya cargada.
create table if not exists branches (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null default 'Principal',
  latitude double precision null,
  longitude double precision null,
  delivery_mode text not null default 'none'
    check (delivery_mode in ('none', 'fixed', 'zones', 'distance')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists branches_tenant_id_idx on branches(tenant_id);

-- Backfill: 1 branch "Principal" por tenant existente, con la config de
-- delivery que ya tenía en `tenants`. No se borran las columnas de `tenants`
-- todavía (varios endpoints las siguen leyendo) — quedan como fuente de
-- verdad del tenant "single-branch" hasta que haya UI de multi-sucursal.
insert into branches (tenant_id, name, latitude, longitude, delivery_mode, active)
select id, 'Principal', latitude, longitude, delivery_mode, true
from tenants
where not exists (
  select 1 from branches b where b.tenant_id = tenants.id
);

alter table orders
  add column if not exists branch_id uuid null references branches(id);
create index if not exists orders_branch_id_idx on orders(branch_id);

-- RLS: mismo criterio que delivery_zones/delivery_ranges (ver
-- 20260706_enable_rls_delivery_tables.sql). Sin policy pública de lectura —
-- la asignación de sucursal corre server-side con service role.
alter table branches enable row level security;

create policy "tenant admin all branches"
on branches for all
using (
  tenant_id in (
    select tenant_users.tenant_id from tenant_users
    where tenant_users.user_id = auth.uid()
  )
)
with check (
  tenant_id in (
    select tenant_users.tenant_id from tenant_users
    where tenant_users.user_id = auth.uid()
  )
);
