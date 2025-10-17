-- Migration: Create jobs table for audio processing
-- This table stores metadata for audio processing jobs including download, ffmpeg processing, and cleanup

-- Create jobs table
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

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_download_token ON jobs(download_token);
CREATE INDEX IF NOT EXISTS idx_jobs_source_url ON jobs(source_url);

-- Create updated_at trigger for jobs table
CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to existing user
GRANT ALL PRIVILEGES ON TABLE jobs TO ytmp3_user;
GRANT ALL PRIVILEGES ON SEQUENCE jobs_id_seq TO ytmp3_user;
