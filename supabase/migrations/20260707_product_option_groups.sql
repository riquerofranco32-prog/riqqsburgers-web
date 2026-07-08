ALTER TABLE products ADD COLUMN IF NOT EXISTS option_groups jsonb NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN products.option_groups IS 'Grupos de opciones obligatorias (ej: "Elegí tu salsa", "Elegí tipo de papas"). Array de {name, required, options: [{name, price}]}. Distinto de extras (tamaño, single-select) y addons (extras pagos, multi-select libre).';
