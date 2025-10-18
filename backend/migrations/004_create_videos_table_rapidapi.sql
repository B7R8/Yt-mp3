-- Migration: Create videos table for RapidAPI-only flow
-- This table stores video conversion metadata with direct download links

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS video_mutex CASCADE;
DROP TABLE IF EXISTS processed_files CASCADE;
DROP TABLE IF EXISTS user_requests CASCADE;
DROP TABLE IF EXISTS conversions CASCADE;
DROP TABLE IF EXISTS jobs CASCADE;

-- Create videos table for RapidAPI-only flow
CREATE TABLE IF NOT EXISTS videos (
  id SERIAL PRIMARY KEY,
  video_id TEXT UNIQUE NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  progress INT DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  download_url TEXT,
  requested_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  completed_at TIMESTAMP NULL,
  error_message TEXT,
  quality TEXT DEFAULT '128k',
  file_size BIGINT,
  duration FLOAT,
  user_ip TEXT,
  expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '7 days')
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_videos_video_id ON videos(video_id);
CREATE INDEX IF NOT EXISTS idx_videos_status ON videos(status);
CREATE INDEX IF NOT EXISTS idx_videos_requested_at ON videos(requested_at);
CREATE INDEX IF NOT EXISTS idx_videos_expires_at ON videos(expires_at);
CREATE INDEX IF NOT EXISTS idx_videos_user_ip ON videos(user_ip);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Add updated_at column and trigger
ALTER TABLE videos ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;
CREATE TRIGGER update_videos_updated_at 
    BEFORE UPDATE ON videos 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to existing user (only if user exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'ytmp3_user') THEN
        GRANT ALL PRIVILEGES ON TABLE videos TO ytmp3_user;
        GRANT ALL PRIVILEGES ON SEQUENCE videos_id_seq TO ytmp3_user;
    END IF;
END $$;

-- Create cleanup function for expired videos
CREATE OR REPLACE FUNCTION cleanup_expired_videos()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete only completed videos older than 7 days with no download URL or expired URLs
    DELETE FROM videos 
    WHERE status = 'done' 
    AND completed_at < (CURRENT_TIMESTAMP - INTERVAL '7 days')
    AND (download_url IS NULL OR download_url = '');
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Also clean up failed jobs older than 1 day
    DELETE FROM videos 
    WHERE status = 'failed' 
    AND requested_at < (CURRENT_TIMESTAMP - INTERVAL '1 day');
    
    GET DIAGNOSTICS deleted_count = deleted_count + ROW_COUNT;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Create a view for active conversions (for monitoring)
CREATE OR REPLACE VIEW active_conversions AS
SELECT 
    video_id,
    title,
    status,
    progress,
    requested_at,
    user_ip,
    CASE 
        WHEN status = 'processing' AND requested_at < (CURRENT_TIMESTAMP - INTERVAL '10 minutes') 
        THEN 'stuck'
        ELSE 'active'
    END as health_status
FROM videos 
WHERE status IN ('pending', 'processing')
AND expires_at > CURRENT_TIMESTAMP;

-- Insert sample data for testing (optional)
-- INSERT INTO videos (video_id, title, status, progress, download_url, completed_at) 
-- VALUES ('dQw4w9WgXcQ', 'Rick Astley - Never Gonna Give You Up', 'done', 100, 'https://example.com/rick.mp3', CURRENT_TIMESTAMP);
