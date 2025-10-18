-- Emergency fix for missing quality columns in conversions table
-- Run this script to add the missing columns that are causing the error

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

-- Verify the columns were added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'conversions' 
AND column_name IN ('quality', 'trim_start', 'trim_duration', 'file_size')
ORDER BY column_name;
