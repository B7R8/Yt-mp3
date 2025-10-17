#!/bin/bash

# YouTube-to-MP3 Converter Backend Startup Script
# This script ensures proper initialization and starts the application

set -e

echo "🚀 Starting YouTube-to-MP3 Converter Backend..."

# Function to log with timestamp
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1"
}

# Function to wait for database
wait_for_database() {
    log "⏳ Waiting for database connection..."
    
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if pg_isready -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-youtube_converter}" >/dev/null 2>&1; then
            log "✅ Database connection established"
            return 0
        fi
        
        log "⏳ Database not ready, attempt $attempt/$max_attempts..."
        sleep 2
        attempt=$((attempt + 1))
    done
    
    log "❌ Failed to connect to database after $max_attempts attempts"
    exit 1
}

# Function to run database migrations
run_migrations() {
    log "🔄 Running database migrations..."
    
    # Check if we're using PostgreSQL
    if [ "${NODE_ENV:-production}" = "production" ] || [ -n "${DB_HOST}" ]; then
        log "📊 Using PostgreSQL database"
        
        # Wait for database to be ready
        wait_for_database
        
        # Run the init.sql script if tables don't exist
        log "🔧 Checking database schema..."
        
        # Test if jobs table exists
        if ! psql -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-youtube_converter}" -c "SELECT 1 FROM jobs LIMIT 1;" >/dev/null 2>&1; then
            log "📋 Initializing database schema..."
            psql -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-youtube_converter}" -f /app/migrations/init.sql
            log "✅ Database schema initialized"
        else
            log "✅ Database schema already exists"
        fi
    else
        log "📊 Using SQLite database (development mode)"
    fi
}

# Function to create necessary directories
create_directories() {
    log "📁 Creating necessary directories..."
    
    mkdir -p "${DOWNLOADS_DIR:-/app/downloads}"
    mkdir -p "${CACHE_DIR:-/app/cache}"
    mkdir -p "${TEMP_DIR:-/app/temp}"
    mkdir -p "${TMP_DIR:-/tmp/app-media}"
    mkdir -p /app/logs
    
    # Set proper permissions
    chmod 755 "${DOWNLOADS_DIR:-/app/downloads}"
    chmod 755 "${CACHE_DIR:-/app/cache}"
    chmod 755 "${TEMP_DIR:-/app/temp}"
    chmod 755 "${TMP_DIR:-/tmp/app-media}"
    chmod 755 /app/logs
    
    log "✅ Directories created and permissions set"
}

# Function to verify dependencies
verify_dependencies() {
    log "🔍 Verifying dependencies..."
    
    # Check Node.js
    if ! command -v node >/dev/null 2>&1; then
        log "❌ Node.js not found"
        exit 1
    fi
    
    # Check ffmpeg
    if ! command -v ffmpeg >/dev/null 2>&1; then
        log "❌ ffmpeg not found"
        exit 1
    fi
    
    # Check yt-dlp
    if ! command -v yt-dlp >/dev/null 2>&1; then
        log "❌ yt-dlp not found"
        exit 1
    fi
    
    log "✅ All dependencies verified"
}

# Function to display system info
display_system_info() {
    log "📊 System Information:"
    log "   Node.js: $(node --version)"
    log "   ffmpeg: $(ffmpeg -version | head -n1)"
    log "   yt-dlp: $(yt-dlp --version)"
    log "   Environment: ${NODE_ENV:-production}"
    log "   Database: ${DB_HOST:-SQLite}"
    log "   Port: ${PORT:-3001}"
    log "   Downloads Dir: ${DOWNLOADS_DIR:-/app/downloads}"
    log "   Temp Dir: ${TEMP_DIR:-/app/temp}"
}

# Main execution
main() {
    log "🎵 YouTube-to-MP3 Converter Backend Starting..."
    
    # Display system information
    display_system_info
    
    # Verify dependencies
    verify_dependencies
    
    # Create directories
    create_directories
    
    # Run database migrations
    run_migrations
    
    log "🚀 Starting application..."
    
    # Start the Node.js application
    exec node dist/index.js
}

# Handle signals for graceful shutdown
trap 'log "🛑 Received shutdown signal, stopping gracefully..."; exit 0' SIGTERM SIGINT

# Run main function
main "$@"