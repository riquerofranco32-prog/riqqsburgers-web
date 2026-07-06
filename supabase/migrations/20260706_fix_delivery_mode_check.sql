-- El modo 'fixed' (precio de envío fijo, delivery_cost) existe en la API y
-- el form de admin desde siempre, pero la migración anterior
-- (20260706_add_delivery_pricing.sql) definió el check constraint sin
-- incluirlo. Guardar el precio de delivery en modo 'fixed' viola el check
-- y tira 500 en el admin.
alter table tenants
  drop constraint if exists tenants_delivery_mode_check;

alter table tenants
  add constraint tenants_delivery_mode_check
  check (delivery_mode in ('none', 'fixed', 'zones', 'distance'));
