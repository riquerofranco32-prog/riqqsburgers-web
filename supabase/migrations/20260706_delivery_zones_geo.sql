-- delivery_zones eran solo {name, price}: el cliente elegía la zona de un
-- <select> sin que nada validara que coincidiera con su dirección real.
-- Se agrega geografía (centro + radio) para poder resolver la zona a partir
-- de la ubicación geocodificada del cliente, igual que ya hace el modo
-- "distance". Nullable: zonas existentes siguen existiendo pero no matchean
-- hasta que el admin les configure ubicación.
alter table delivery_zones
  add column lat double precision,
  add column lng double precision,
  add column radius_km numeric;
