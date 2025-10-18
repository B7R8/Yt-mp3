-- PostgreSQL initialization script for YouTube-to-MP3 Converter
-- This script creates the necessary tables and indexes

-- Create conversions table
CREATE TABLE IF NOT EXISTS conversions (
    id VARCHAR(255) PRIMARY KEY,
    youtube_url TEXT NOT NULL,
    video_title TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    progress INTEGER DEFAULT 0,
    mp3_filename TEXT,
    error_message TEXT,
    quality_message TEXT,
    direct_download_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create blacklist table
CREATE TABLE IF NOT EXISTS blacklist (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('channel', 'url', 'video_id')),
    value TEXT NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'admin'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_conversions_youtube_url ON conversions(youtube_url);
CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type);
CREATE INDEX IF NOT EXISTS idx_blacklist_value ON blacklist(value);

-- Create updated_at trigger for conversions table
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_conversions_updated_at 
    BEFORE UPDATE ON conversions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Create updated_at trigger for blacklist table
CREATE TRIGGER update_blacklist_updated_at 
    BEFORE UPDATE ON blacklist 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add direct_download_url column if it doesn't exist (for existing databases)
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS direct_download_url TEXT;

-- Create jobs table for audio processing
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

-- Create indexes for jobs table
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

-- Create user if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'ytmp3_user') THEN
        CREATE USER ytmp3_user WITH PASSWORD 'ytmp3_password';
    END IF;
END
$$;

-- Grant permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ytmp3_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ytmp3_user;
GRANT ALL PRIVILEGES ON TABLE jobs TO ytmp3_user;
