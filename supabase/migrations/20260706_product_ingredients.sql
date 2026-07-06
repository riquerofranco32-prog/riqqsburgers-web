-- Ingredientes base removibles por producto (ej: "sin cebolla"). No tienen
-- precio — a diferencia de extras/addons, esto es una lista de lo que ya
-- viene incluido y el cliente puede destildar sin costo.
alter table products
  add column ingredients text[] not null default '{}';
