-- Modo 'fixed': costo de envío único para todos los pedidos, reutilizando
-- la columna tenants.delivery_cost que ya existía antes de este feature.
alter table tenants drop constraint tenants_delivery_mode_check;
alter table tenants
  add constraint tenants_delivery_mode_check
  check (delivery_mode in ('none', 'fixed', 'zones', 'distance'));
