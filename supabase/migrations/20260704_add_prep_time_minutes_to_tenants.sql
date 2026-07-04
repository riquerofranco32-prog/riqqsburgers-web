alter table tenants
  add column prep_time_minutes integer null check (prep_time_minutes > 0);

comment on column tenants.prep_time_minutes is 'Minutos estimados de preparacion para retiro en local. Null = usar default de 25 min en la app. Para delivery se le suma un margen fijo de envio en el cliente.';
