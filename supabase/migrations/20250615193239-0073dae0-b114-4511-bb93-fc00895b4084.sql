
-- Add store_description column to store_settings table
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS store_description text;
