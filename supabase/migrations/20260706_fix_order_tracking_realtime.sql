-- orders nunca se agregó a la publicación supabase_realtime: tanto el sonido
-- de "nuevo pedido" del admin (RecentOrdersTable/OrdersTable, postgres_changes
-- filtrado por tenant_id, ya protegido por RLS existente) como el seguimiento
-- del cliente dependían de esto y quedaban rotos en silencio.
alter publication supabase_realtime add table orders;

-- El seguimiento público (/pedido/[ref]) no puede usar postgres_changes con
-- anon porque exigiría una policy de SELECT abierta sobre orders, filtrando
-- por id pero exponiendo el resto de la tabla (nombre/teléfono/dirección de
-- todos los pedidos de todos los tenants) a cualquier request REST con la
-- anon key. En cambio, se transmite solo el status por un topic privado
-- keyeado por el id (uuid no adivinable) del pedido — mismo modelo de acceso
-- que ya usa la página de tracking (service role + conocer el ref/id).
create or replace function public.broadcast_order_status()
returns trigger
security definer set search_path = ''
language plpgsql
as $$
begin
  perform realtime.send(
    jsonb_build_object('status', new.status),
    'status',
    'order:' || new.id::text,
    true
  );
  return null;
end;
$$;

create trigger orders_broadcast_status
after update of status on public.orders
for each row
execute function public.broadcast_order_status();

create policy "anon can receive order status broadcasts"
on realtime.messages
for select
to anon
using (realtime.topic() like 'order:%');
