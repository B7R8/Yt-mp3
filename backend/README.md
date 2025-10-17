# YouTube-to-MP3 Converter Backend

A fully refactored, production-ready YouTube-to-MP3 converter backend with proper job queue management, server-side processing, and comprehensive error handling.

## 🚀 Key Features

### ✅ Fixed Issues
- **Multiple Requests Issue**: Implemented video mutex system to prevent duplicate processing
- **Download Link Validation**: Replaced external API dependency with server-side processing
- **Processing Pipeline**: Complete refactor to download → process → store workflow
- **Database Errors**: Fixed missing tables and improved schema
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Logging**: Enhanced logging with job ID, video ID, user ID tracking
- **Cleanup Routine**: Fixed cleanup to only handle files, not database operations

### 🏗️ Architecture

#### Core Components
1. **ConversionService**: Main service handling job creation and processing
2. **ErrorHandler**: Comprehensive error handling and user-friendly messages
3. **Database Schema**: Proper tables for jobs, processed_files, user_requests, video_mutex
4. **Job Queue**: In-memory queue with mutex per video to prevent duplicates
5. **Processing Pipeline**: yt-dlp → ffmpeg → server storage workflow

#### Database Schema
```sql
-- Main jobs table
jobs (id, video_id, youtube_url, video_title, user_id, status, quality, 
      trim_start, trim_duration, file_path, file_size, duration, 
      ffmpeg_logs, error_message, download_url, created_at, updated_at, expires_at)

-- Track processed files
processed_files (id, job_id, file_path, file_size, created_at, accessed_at, expires_at)

-- User activity tracking
user_requests (id, user_id, ip_address, video_id, job_id, request_type, created_at)

-- Video mutex to prevent duplicates
video_mutex (video_id, job_id, locked_at, expires_at)
```

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 15+ (or SQLite for development)
- Docker & Docker Compose
- ffmpeg
- yt-dlp

### Environment Variables
```bash
# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=youtube_converter
DB_USER=postgres
DB_PASSWORD=postgres

# Application
NODE_ENV=production
PORT=3001
MAX_CONCURRENT_JOBS=5

# Directories
DOWNLOADS_DIR=/app/downloads
TEMP_DIR=/app/temp
CACHE_DIR=/app/cache

# Processing
FFMPEG_TIMEOUT=300000
MAX_FILE_AGE_HOURS=24
```

### Docker Deployment
```bash
# Build and start services
docker-compose up -d

# Check logs
docker-compose logs -f backend

# Stop services
docker-compose down
```

### Manual Setup
```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Start application
npm start
```

## 📡 API Endpoints

### Conversion Endpoints

#### POST /api/convert
Create a new conversion job.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "128k",
  "trimStart": 10,
  "trimDuration": 30,
  "userId": "optional_user_id"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid",
  "status": "pending",
  "message": "Conversion job started successfully"
}
```

#### GET /api/status/:jobId
Get job status and details.

**Response:**
```json
{
  "success": true,
  "jobId": "uuid",
  "status": "completed",
  "video_title": "Video Title",
  "quality": "128k",
  "file_size": 1234567,
  "duration": 180.5,
  "download_url": "/api/download/uuid",
  "download_filename": "Video Title.mp3",
  "created_at": "2025-01-17T10:00:00Z",
  "expires_at": "2025-01-18T10:00:00Z"
}
```

#### GET /api/download/:jobId
Download the processed MP3 file.

**Response:** Binary MP3 file with proper headers.

#### GET /api/video-info
Get video information without processing.

**Request:** `?url=https://www.youtube.com/watch?v=VIDEO_ID`

**Response:**
```json
{
  "success": true,
  "title": "Video Title",
  "duration": 180.5,
  "durationFormatted": "3:00",
  "thumbnail": "https://...",
  "uploader": "Channel Name",
  "viewCount": "1000000"
}
```

### Utility Endpoints

#### GET /api/stats
Get system statistics.

#### POST /api/cleanup
Trigger manual cleanup of expired files.

#### GET /api/debug/files
Debug endpoint to check downloaded files.

## 🔄 Processing Pipeline

### 1. Job Creation
1. Validate YouTube URL
2. Extract video ID
3. Check video mutex (prevent duplicates)
4. Create job in database
5. Start async processing

### 2. Video Processing
1. Acquire video mutex
2. Get video info using yt-dlp
3. Download video to temp directory
4. Process audio with ffmpeg (quality/trim)
5. Move to downloads directory
6. Update job status
7. Release mutex

### 3. File Management
1. Files stored in `/app/downloads/`
2. Automatic cleanup after 24 hours
3. Processed files tracked in database
4. Temp files cleaned up immediately

## 🛡️ Error Handling

### Error Categories
- **Network Errors**: Connection timeouts, DNS failures
- **YouTube Errors**: Private videos, age restrictions, copyright blocks
- **Processing Errors**: ffmpeg failures, disk space issues
- **Database Errors**: Connection issues, missing tables

### Fallback Strategies
- **Retry Logic**: Automatic retries with exponential backoff
- **User-Friendly Messages**: Clear error messages for users
- **Technical Logging**: Detailed logs for debugging
- **Graceful Degradation**: Service continues despite individual failures

## 📊 Monitoring & Logging

### Log Structure
```json
{
  "timestamp": "2025-01-17T10:00:00Z",
  "level": "info",
  "message": "Job completed successfully",
  "context": {
    "jobId": "uuid",
    "videoId": "VIDEO_ID",
    "userId": "user123",
    "operation": "processJob",
    "fileSize": 1234567,
    "duration": 180.5
  }
}
```

### Key Metrics
- Job completion rate
- Processing time
- Error rates by category
- File storage usage
- Active concurrent jobs

## 🔧 Configuration

### Quality Settings
- `64k`: Low quality, small file size
- `128k`: Default quality (recommended)
- `192k`: High quality
- `256k`: Very high quality
- `320k`: Maximum quality

### Trim Options
- `trimStart`: Start time in seconds
- `trimDuration`: Duration in seconds
- Both optional, defaults to full video

### Rate Limiting
- Conversion: 20 requests per 15 minutes per IP
- Status checks: 100 requests per minute per IP
- Downloads: 50 requests per 5 minutes per IP

## 🚨 Troubleshooting

### Common Issues

#### "Video is already being processed"
- **Cause**: Video mutex is active
- **Solution**: Wait for current job to complete or check existing job status

#### "Download failed"
- **Cause**: Network issues or video unavailable
- **Solution**: Check video URL and network connection

#### "Audio processing failed"
- **Cause**: ffmpeg error or corrupted download
- **Solution**: Retry the conversion

#### "Database connection failed"
- **Cause**: PostgreSQL not running or connection issues
- **Solution**: Check database service and connection settings

### Debug Commands
```bash
# Check system status
curl http://localhost:3001/api/stats

# Check downloaded files
curl http://localhost:3001/api/debug/files

# Manual cleanup
curl -X POST http://localhost:3001/api/cleanup

# Check logs
docker-compose logs -f backend
```

## 🔒 Security Features

- **Input Validation**: Comprehensive URL and parameter validation
- **Rate Limiting**: Prevents abuse and overload
- **File Sanitization**: Safe file handling and cleanup
- **Error Sanitization**: No sensitive data in error messages
- **CORS Protection**: Configurable cross-origin policies
- **Helmet Security**: Security headers and protections

## 📈 Performance Optimizations

- **Concurrent Job Limits**: Configurable max concurrent processing
- **Video Mutex**: Prevents duplicate processing
- **File Cleanup**: Automatic cleanup of old files
- **Database Indexes**: Optimized queries with proper indexing
- **Memory Management**: Efficient memory usage for large files
- **Connection Pooling**: Database connection optimization

## 🧪 Testing

### Manual Testing
```bash
# Test conversion
curl -X POST http://localhost:3001/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ", "quality": "128k"}'

# Check status
curl http://localhost:3001/api/status/JOB_ID

# Download file
curl -O http://localhost:3001/api/download/JOB_ID
```

### Health Checks
- Database connectivity
- File system access
- ffmpeg availability
- yt-dlp functionality

## 📝 Changelog

### v2.0.0 - Complete Refactor
- ✅ Fixed multiple requests issue with video mutex
- ✅ Replaced external API with server-side processing
- ✅ Implemented proper job queue system
- ✅ Enhanced error handling and logging
- ✅ Fixed database schema and cleanup routines
- ✅ Added comprehensive monitoring and stats
- ✅ Improved security and performance

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

For issues and questions:
1. Check the troubleshooting section
2. Review the logs for error details
3. Check system status with `/api/stats`
4. Create an issue with detailed information

---

**Note**: This backend is designed for production use with proper error handling, monitoring, and security features. The refactored system eliminates the previous issues with multiple requests, external API dependencies, and database errors.
