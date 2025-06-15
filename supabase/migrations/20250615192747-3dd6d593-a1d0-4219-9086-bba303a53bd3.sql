
-- Add main_text column to store_settings table
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS main_text text;
