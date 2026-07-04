alter table products
  add column stock_quantity integer null check (stock_quantity >= 0);

comment on column products.stock_quantity is 'Null = sin control de stock (comportamiento binario actual via available). No-null = se descuenta en cada pedido y al llegar a 0 se marca available=false automaticamente.';
