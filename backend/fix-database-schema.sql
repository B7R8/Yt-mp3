-- Fix database schema by adding missing columns to conversions table
-- Run this script to add the missing columns

-- Add missing columns to conversions table
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS quality VARCHAR(10) DEFAULT 'high';
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS trim_start FLOAT DEFAULT NULL;
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS trim_duration FLOAT DEFAULT NULL;
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS file_size BIGINT DEFAULT NULL;
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours');

-- Update existing records to have default values
UPDATE conversions SET quality = 'high' WHERE quality IS NULL;
UPDATE conversions SET expires_at = (created_at + INTERVAL '24 hours') WHERE expires_at IS NULL;

-- Create index on quality column for better performance
CREATE INDEX IF NOT EXISTS idx_conversions_quality ON conversions(quality);

-- Create index on expires_at column for cleanup operations
CREATE INDEX IF NOT EXISTS idx_conversions_expires_at ON conversions(expires_at);

-- Show the updated table structure
\d conversions;
