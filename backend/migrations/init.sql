-- PostgreSQL initialization script for YouTube-to-MP3 Converter
-- This script creates the necessary tables and indexes

-- Create conversions table (legacy table for backward compatibility)
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

-- Create main jobs table for conversion jobs
CREATE TABLE IF NOT EXISTS jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id VARCHAR(50) NOT NULL,
    youtube_url TEXT NOT NULL,
    video_title TEXT,
    user_id VARCHAR(255), -- Optional user identification
    status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
    quality VARCHAR(10) DEFAULT '128k',
    trim_start FLOAT DEFAULT NULL,
    trim_duration FLOAT DEFAULT NULL,
    file_path TEXT, -- Path to processed file on server
    file_size BIGINT,
    duration FLOAT,
    ffmpeg_logs TEXT, -- Store ffmpeg processing logs
    error_message TEXT,
    download_url TEXT, -- Direct download URL
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '24 hours')
);

-- Create processed_files table for tracking server files
CREATE TABLE IF NOT EXISTS processed_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_size BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL
);

-- Create user_requests table for tracking user activity
CREATE TABLE IF NOT EXISTS user_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id VARCHAR(255),
    ip_address INET,
    video_id VARCHAR(50),
    job_id UUID REFERENCES jobs(id) ON DELETE SET NULL,
    request_type VARCHAR(50) NOT NULL, -- 'convert', 'download', 'status'
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create video_mutex table to prevent duplicate processing
CREATE TABLE IF NOT EXISTS video_mutex (
    video_id VARCHAR(50) PRIMARY KEY,
    job_id UUID REFERENCES jobs(id) ON DELETE CASCADE,
    locked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL DEFAULT (CURRENT_TIMESTAMP + INTERVAL '30 minutes')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_conversions_youtube_url ON conversions(youtube_url);
CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type);
CREATE INDEX IF NOT EXISTS idx_blacklist_value ON blacklist(value);

-- Jobs table indexes
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_video_id ON jobs(video_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at);
CREATE INDEX IF NOT EXISTS idx_jobs_user_id ON jobs(user_id);

-- Processed files indexes
CREATE INDEX IF NOT EXISTS idx_processed_files_job_id ON processed_files(job_id);
CREATE INDEX IF NOT EXISTS idx_processed_files_expires_at ON processed_files(expires_at);
CREATE INDEX IF NOT EXISTS idx_processed_files_file_path ON processed_files(file_path);

-- User requests indexes
CREATE INDEX IF NOT EXISTS idx_user_requests_user_id ON user_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_user_requests_ip_address ON user_requests(ip_address);
CREATE INDEX IF NOT EXISTS idx_user_requests_video_id ON user_requests(video_id);
CREATE INDEX IF NOT EXISTS idx_user_requests_created_at ON user_requests(created_at);

-- Video mutex indexes
CREATE INDEX IF NOT EXISTS idx_video_mutex_expires_at ON video_mutex(expires_at);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_conversions_updated_at 
    BEFORE UPDATE ON conversions 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_blacklist_updated_at 
    BEFORE UPDATE ON blacklist 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_jobs_updated_at 
    BEFORE UPDATE ON jobs 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add direct_download_url column if it doesn't exist (for existing databases)
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS direct_download_url TEXT;

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
