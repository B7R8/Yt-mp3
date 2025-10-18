-- Migration: Add processed_path column to conversions table
-- This migration adds the processed_path column to existing databases

-- Add processed_path column if it doesn't exist
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS processed_path TEXT;

-- Add index for better performance on processed_path queries
CREATE INDEX IF NOT EXISTS idx_conversions_processed_path ON conversions(processed_path) WHERE processed_path IS NOT NULL;
