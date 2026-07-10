-- Cupones programables: además de expires_at (ya existía como fecha de fin),
-- suma una fecha de inicio opcional. Un cupón con starts_at en el futuro se
-- valida como "todavía no activo" aunque el toggle manual `active` esté en
-- true — igual que ya pasa con expires_at vencido.
alter table public.coupons
  add column if not exists starts_at timestamptz null;
