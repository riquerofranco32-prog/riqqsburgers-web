create table reviews (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references tenants(id) on delete cascade,
  order_id uuid not null unique references orders(id) on delete cascade,
  rating integer not null check (rating between 1 and 5),
  comment text null,
  customer_name text null,
  created_at timestamptz not null default now()
);

create index reviews_tenant_id_idx on reviews(tenant_id);

alter table reviews enable row level security;

-- Todo el acceso de la app pasa por rutas server con service role (igual que
-- orders/coupons); esta policy es defensa en profundidad si alguna vez se
-- consulta directo con la anon key.
create policy "tenant admin all reviews"
on reviews for all
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
