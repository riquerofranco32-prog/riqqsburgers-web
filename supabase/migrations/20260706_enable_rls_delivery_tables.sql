-- delivery_zones/delivery_ranges/geocode_cache se crearon sin RLS: con la
-- anon key pública, cualquier cliente podría leer/escribir/borrar las zonas
-- o rangos de cualquier tenant directo vía PostgREST. Mismo problema que
-- coupons tuvo (ver 20260703_enable_rls_coupons.sql), mismo fix.

alter table delivery_zones enable row level security;

create policy "tenant admin all delivery_zones"
on delivery_zones for all
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

-- El checkout público necesita listar las zonas activas para el dropdown.
create policy "public read active delivery_zones"
on delivery_zones for select
to anon, authenticated
using (active = true);

alter table delivery_ranges enable row level security;

create policy "tenant admin all delivery_ranges"
on delivery_ranges for all
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

-- Sin policy de lectura pública: el checkout solo manda coordenadas al pin y
-- el precio se resuelve server-side vía /api/delivery/quote (service role).

alter table geocode_cache enable row level security;
-- Solo el servidor (service role, que bypassa RLS) toca esta tabla — no hace
-- falta ninguna policy para anon/authenticated.
