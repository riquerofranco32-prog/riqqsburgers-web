alter table tenants
  add column business_hours jsonb null;

comment on column tenants.business_hours is 'Null = sin horario automatico (solo el toggle manual is_open manda, como hoy). Si tiene valor: array de 7 posiciones (0=domingo..6=sabado) con {open, close, closed} en hora de Argentina; is_open pasa a ser el override manual de "cerrado forzado" y el estado real se calcula server-side contra este horario.';
