-- Costo de envío por tenant: 'none' (solo retiro), 'zones' (precio fijo por
-- zona con nombre) o 'distance' (precio por rango de km desde el local).
alter table tenants
  add column if not exists latitude double precision null,
  add column if not exists longitude double precision null,
  add column if not exists delivery_mode text not null default 'none'
    check (delivery_mode in ('none', 'zones', 'distance')),
  add column if not exists delivery_city_hint text null,
  add column if not exists delivery_out_of_range_msg text not null
    default 'Consultanos por WhatsApp el costo de envío a tu zona';

comment on column tenants.delivery_mode is 'none = solo retiro en local, zones = zonas con precio fijo, distance = precio por rango de km (Haversine) desde latitude/longitude.';
comment on column tenants.delivery_city_hint is 'Ej: "San Rafael, Mendoza" — usado como bias para el geocoder en modo distance.';

create table if not exists delivery_zones (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  name text not null,
  price numeric not null default 0,
  active boolean not null default true,
  sort_order int not null default 0
);
create index if not exists delivery_zones_tenant_id_idx on delivery_zones(tenant_id);

create table if not exists delivery_ranges (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  max_km numeric not null check (max_km > 0),
  price numeric not null default 0,
  active boolean not null default true
);
create index if not exists delivery_ranges_tenant_id_idx on delivery_ranges(tenant_id);

-- Cache de geocoding (Photon/Nominatim) para no re-consultar la misma
-- dirección ni golpear los rate limits de los servicios gratuitos.
create table if not exists geocode_cache (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  query_normalized text not null,
  results jsonb not null,
  created_at timestamptz not null default now(),
  unique (tenant_id, query_normalized)
);

alter table orders
  add column if not exists delivery_address text null,
  add column if not exists delivery_lat double precision null,
  add column if not exists delivery_lng double precision null,
  add column if not exists delivery_zone_name text null,
  add column if not exists delivery_distance_km numeric null;

-- Backfill: los tenants que ya cobraban delivery_cost fijo (comportamiento
-- de "zona única" implícito) pasan a modo 'zones' con una zona "Envío" que
-- preserva el mismo precio — sin este paso perderían la opción de delivery
-- en el checkout apenas se aplique la migración.
insert into delivery_zones (tenant_id, name, price, sort_order)
select id, 'Envío', delivery_cost, 0
from tenants
where delivery_cost > 0;

update tenants set delivery_mode = 'zones' where delivery_cost > 0;
