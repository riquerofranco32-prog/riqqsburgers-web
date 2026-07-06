-- Categorías tipo "Pizza" pueden habilitar pedir mitad y mitad: dos productos
-- de la misma categoría combinados en un solo ítem, cobrando el precio del
-- más caro (ver lib/getRestaurant.ts / ProductDetailSheet.tsx).
alter table categories
  add column allow_half boolean not null default false;
