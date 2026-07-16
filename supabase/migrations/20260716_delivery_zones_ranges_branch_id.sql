-- branch_id en delivery_zones/delivery_ranges: hoy cada tenant tiene 1 sola
-- branch (ver 20260716_add_branches_table.sql), así que tenant_id sigue
-- siendo válido para filtrar. Se agrega branch_id nullable *sin reemplazar*
-- tenant_id — app/api/delivery-zones, app/api/delivery-ranges y los
-- editores de admin siguen consultando por tenant_id sin cambios. branch_id
-- se usa solo en app/api/orders/route.ts para resolver el costo de envío
-- contra la sucursal asignada, no contra el tenant entero.
alter table delivery_zones
  add column if not exists branch_id uuid null references branches(id) on delete cascade;
alter table delivery_ranges
  add column if not exists branch_id uuid null references branches(id) on delete cascade;

create index if not exists delivery_zones_branch_id_idx on delivery_zones(branch_id);
create index if not exists delivery_ranges_branch_id_idx on delivery_ranges(branch_id);

-- Backfill: como hoy hay exactamente 1 branch por tenant, cada zona/rango
-- apunta a esa branch.
update delivery_zones dz
set branch_id = b.id
from branches b
where b.tenant_id = dz.tenant_id and dz.branch_id is null;

update delivery_ranges dr
set branch_id = b.id
from branches b
where b.tenant_id = dr.tenant_id and dr.branch_id is null;

-- Trigger: los endpoints de admin (app/api/delivery-zones, app/api/
-- delivery-ranges) insertan solo con tenant_id, no con branch_id — no se
-- tocan esos endpoints en este feature (no hay UI de multi-sucursal aún).
-- Este trigger completa branch_id automáticamente con la primera branch
-- activa del tenant, para que zonas/rangos creados después de esta
-- migración también queden asociados a una sucursal.
-- ponytail: asume 1 branch activa por tenant (la realidad actual). El día
-- que se agregue UI de multi-sucursal para zonas/rangos, este trigger deja
-- de alcanzar y hay que pasar branch_id explícito desde el admin.
create or replace function set_delivery_branch_id_from_tenant()
returns trigger as $$
begin
  if new.branch_id is null then
    select id into new.branch_id
    from branches
    where tenant_id = new.tenant_id and active = true
    order by created_at
    limit 1;
  end if;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists delivery_zones_set_branch_id on delivery_zones;
create trigger delivery_zones_set_branch_id
before insert on delivery_zones
for each row execute function set_delivery_branch_id_from_tenant();

drop trigger if exists delivery_ranges_set_branch_id on delivery_ranges;
create trigger delivery_ranges_set_branch_id
before insert on delivery_ranges
for each row execute function set_delivery_branch_id_from_tenant();
