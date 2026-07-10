-- El toggle rápido de "agotado" en el admin (ProductsAdmin) ya persiste en
-- Supabase, pero el catálogo público (CatalogClient) no escuchaba cambios de
-- products — recién se enteraba al recargar la página. Habilita la tabla en
-- la publicación de realtime para que el listener nuevo en CatalogClient
-- (canal tenant-products-<id>) reciba los UPDATE/INSERT/DELETE.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and tablename = 'products'
  ) then
    alter publication supabase_realtime add table products;
  end if;
end $$;
