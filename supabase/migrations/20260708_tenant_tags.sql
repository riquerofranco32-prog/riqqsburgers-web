-- Add tags column to tenants for business categorization.
-- Used by /explorar page filters (tipo de cocina, delivery, etc.)
ALTER TABLE tenants
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}';

-- Index for array containment queries (e.g. WHERE tags @> ARRAY['pizzeria'])
CREATE INDEX IF NOT EXISTS idx_tenants_tags ON tenants USING GIN (tags);

COMMENT ON COLUMN tenants.tags IS 'Business tags for discovery/filtering: pizzeria, hamburgueseria, heladeria, cafeteria, dark-kitchen, sushi, delivery, takeaway, etc.';
