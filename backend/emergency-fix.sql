-- Emergency Database Fix Script
-- Run this to fix all database schema issues immediately

-- Add processed_path column to conversions table if it doesn't exist
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS processed_path TEXT;

-- Create index for processed_path if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_conversions_processed_path ON conversions(processed_path) WHERE processed_path IS NOT NULL;

-- Ensure the update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create jobs table if it doesn't exist (with all required columns)
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'ready', 'failed', 'deleted')),
    direct_download_url TEXT,
    processed_path TEXT,
    file_size BIGINT,
    duration FLOAT,
    bitrate INT,
    action TEXT CHECK (action IN ('trim', 'reencode', 'none')),
    trim_start FLOAT,
    trim_duration FLOAT,
    download_token TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    error_message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add processed_path column to jobs table if it doesn't exist
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS processed_path TEXT;

-- Create basic indexes for jobs table
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_source_url ON jobs(source_url);

-- Create download_token index only if column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'jobs' AND column_name = 'download_token') THEN
        CREATE INDEX IF NOT EXISTS idx_jobs_download_token ON jobs(download_token);
    END IF;
END $$;

-- Create trigger for jobs table
DROP TRIGGER IF EXISTS update_jobs_updated_at ON jobs;
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions if user exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ytmp3_user') THEN
        GRANT ALL PRIVILEGES ON TABLE jobs TO ytmp3_user;
        GRANT ALL PRIVILEGES ON SEQUENCE jobs_id_seq TO ytmp3_user;
    END IF;
END $$;

-- Show success message
SELECT 'Emergency database fix completed successfully!' as status;

