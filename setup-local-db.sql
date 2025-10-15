-- Setup script for local PostgreSQL installation
-- Run this in PostgreSQL command line or pgAdmin

-- Create database
CREATE DATABASE ytmp3;

-- Create user
CREATE USER ytmp3_user WITH PASSWORD 'ytmp3_secure_password_2024';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ytmp3 TO ytmp3_user;

-- Connect to the database and create tables
\c ytmp3;

-- Create conversions table
CREATE TABLE IF NOT EXISTS conversions (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(255) UNIQUE NOT NULL,
    title TEXT NOT NULL,
    duration INTEGER,
    file_size BIGINT,
    status VARCHAR(50) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    download_count INTEGER DEFAULT 0,
    last_downloaded_at TIMESTAMP,
    file_path TEXT,
    thumbnail_url TEXT,
    channel_name VARCHAR(255),
    view_count BIGINT,
    like_count INTEGER,
    description TEXT
);

-- Create blacklist table
CREATE TABLE IF NOT EXISTS blacklist (
    id SERIAL PRIMARY KEY,
    video_id VARCHAR(255) UNIQUE NOT NULL,
    reason TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Grant table privileges
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ytmp3_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ytmp3_user;
