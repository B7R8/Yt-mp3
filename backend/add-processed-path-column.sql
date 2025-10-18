-- Add processed_path column to conversions table
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS processed_path TEXT;
