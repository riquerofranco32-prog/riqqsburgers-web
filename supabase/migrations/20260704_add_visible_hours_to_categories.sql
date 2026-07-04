alter table categories
  add column visible_from text null,
  add column visible_to text null;

comment on column categories.visible_from is 'Hora "HH:MM" (Argentina) desde la que la categoria aparece en el catalogo. Null en ambos = siempre visible (comportamiento actual).';
comment on column categories.visible_to is 'Hora "HH:MM" (Argentina) hasta la que la categoria aparece en el catalogo. Si visible_to <= visible_from se interpreta como que cruza la medianoche.';
