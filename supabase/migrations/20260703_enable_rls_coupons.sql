-- coupons had RLS disabled since table creation: with the public anon key,
-- any client could read/write/delete any tenant's coupons directly via PostgREST.
alter table coupons enable row level security;

create policy "tenant admin all coupons"
on coupons for all
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

-- anon/authenticated need to look up a coupon by code at checkout, but only
-- active, unexpired ones, and only enough columns to validate + apply it.
create policy "public read active coupons for validation"
on coupons for select
to anon, authenticated
using (active = true and (expires_at is null or expires_at > now()));
