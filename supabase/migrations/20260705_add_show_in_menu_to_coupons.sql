-- Cupones visibles en el menú público (opt-in por cupón para no exponer
-- códigos privados, ej. códigos de influencers)
alter table coupons
  add column if not exists show_in_menu boolean not null default false;
