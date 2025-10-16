# YouTube MP3 Converter - Deployment Guide

## Overview

This project has been completely refactored to use the YouTube MP3 API from RapidAPI instead of yt-dlp, making it faster, lighter, and more reliable.

## Key Changes

### Backend Changes
- ✅ Removed all yt-dlp dependencies and Python requirements
- ✅ Implemented YouTube MP3 API from RapidAPI
- ✅ Simplified conversion service
- ✅ Removed FFmpeg dependencies
- ✅ Optimized Docker configuration
- ✅ Reduced image size significantly

### Frontend Changes
- ✅ Simplified theme toggle (light/dark only)
- ✅ Improved responsive design
- ✅ Better performance and loading times
- ✅ Cleaner UI components

## Environment Variables

Create a `.env` file with the following variables:

```bash
# Database Configuration
DB_HOST=postgres
DB_PORT=5432
DB_NAME=youtube_converter
DB_USER=postgres
DB_PASSWORD=postgres
DB_TYPE=postgres

# Server Configuration
NODE_ENV=production
PORT=3001

# RapidAPI Configuration
RAPIDAPI_KEY=546e353d67msha411dc0cd0b0b7dp153e93jsn651c16a2c85b

# Performance Configuration
MAX_WORKERS=4
MAX_CONCURRENT_JOBS=10
MAX_CACHE_SIZE=100
CACHE_TTL=3600000
MAX_FILE_AGE_HOURS=24

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=20

# Logging
LOG_LEVEL=info

# Security
ENABLE_METRICS=true
DISABLE_SOURCE_MAPS=true
HIDE_SERVER_INFO=true
SECURE_HEADERS=true

# CORS
CORS_ORIGIN=https://saveytb.com

# Frontend Configuration
VITE_API_URL=https://saveytb.com/api
VITE_APP_NAME=YouTube to MP3 Converter
VITE_APP_VERSION=2.0.0
```

## Quick Deployment

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd yt-mp3
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Deploy with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Check status**
   ```bash
   docker-compose ps
   docker-compose logs -f
   ```

## Performance Improvements

- **Faster startup**: No Python/yt-dlp installation required
- **Smaller image size**: Removed heavy dependencies
- **Better reliability**: API-based conversion instead of local processing
- **Simplified maintenance**: No cookie management or proxy configuration needed
- **Improved caching**: Better memory management and caching strategies

## API Endpoints

The API endpoints remain the same for backward compatibility:

- `POST /api/check-url` - Validate YouTube URL
- `POST /api/convert` - Start conversion
- `GET /api/status/:id` - Get conversion status
- `GET /api/download/:id` - Download converted file
- `GET /api/video-info` - Get video information
- `GET /api/stats` - System statistics

## Monitoring

- Health check: `GET /api/health`
- System stats: `GET /api/stats`
- Logs: Available in `./logs/` directory

## Troubleshooting

1. **Check logs**
   ```bash
   docker-compose logs backend
   docker-compose logs frontend
   ```

2. **Restart services**
   ```bash
   docker-compose restart
   ```

3. **Check environment variables**
   ```bash
   docker-compose exec backend env | grep RAPIDAPI
   ```

## Security Notes

- The RapidAPI key is included for demo purposes
- For production, use your own RapidAPI key
- All security headers are enabled by default
- Rate limiting is configured for protection

## Support

The system is now much simpler and more reliable. If you encounter any issues:

1. Check the logs first
2. Verify environment variables
3. Ensure RapidAPI key is valid
4. Check network connectivity
