-- Add columns that the admin panel writes but may not exist in the tenants table.
-- Safe to run multiple times (IF NOT EXISTS).

ALTER TABLE tenants ADD COLUMN IF NOT EXISTS logo_url        TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS banner_url      TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS hero_video_url  TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS mp_link         TEXT;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand           JSONB;
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS secondary_color TEXT NOT NULL DEFAULT '#FFB347';
ALTER TABLE tenants ADD COLUMN IF NOT EXISTS background_color TEXT NOT NULL DEFAULT '#FFFAF7';
