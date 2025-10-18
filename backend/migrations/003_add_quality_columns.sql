-- Migration: Add quality, trim_start, and trim_duration columns to conversions table
-- This migration adds the missing columns that are referenced in the application code

-- Add quality column if it doesn't exist
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS quality VARCHAR(20) DEFAULT '192k';

-- Add trim_start column if it doesn't exist
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS trim_start FLOAT;

-- Add trim_duration column if it doesn't exist
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS trim_duration FLOAT;

-- Add file_size column if it doesn't exist
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS file_size BIGINT;

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_conversions_quality ON conversions(quality);
CREATE INDEX IF NOT EXISTS idx_conversions_trim_start ON conversions(trim_start) WHERE trim_start IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversions_trim_duration ON conversions(trim_duration) WHERE trim_duration IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversions_file_size ON conversions(file_size) WHERE file_size IS NOT NULL;
