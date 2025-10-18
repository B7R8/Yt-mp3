-- SQLite initialization script for YouTube-to-MP3 Converter
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
    processed_path TEXT,
    quality VARCHAR(20) DEFAULT '192k',
    trim_start REAL,
    trim_duration REAL,
    file_size INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create blacklist table
CREATE TABLE IF NOT EXISTS blacklist (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type VARCHAR(50) NOT NULL CHECK (type IN ('channel', 'url', 'video_id')),
    value TEXT NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'admin'
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);
CREATE INDEX IF NOT EXISTS idx_conversions_youtube_url ON conversions(youtube_url);
CREATE INDEX IF NOT EXISTS idx_conversions_quality ON conversions(quality);
CREATE INDEX IF NOT EXISTS idx_conversions_trim_start ON conversions(trim_start) WHERE trim_start IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversions_trim_duration ON conversions(trim_duration) WHERE trim_duration IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_conversions_file_size ON conversions(file_size) WHERE file_size IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blacklist_type ON blacklist(type);
CREATE INDEX IF NOT EXISTS idx_blacklist_value ON blacklist(value);

-- Add direct_download_url column if it doesn't exist (for existing databases)
-- Note: SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN
-- This will be handled in the application code
