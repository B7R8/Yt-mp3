# YouTube MP3 Converter with Audio Processing

A complete YouTube-to-MP3 converter with advanced audio processing capabilities, built with Node.js, Express, PostgreSQL, and Docker.

## Features

### Core Functionality
- **YouTube to MP3 Conversion**: Convert YouTube videos to MP3 using RapidAPI
- **Audio Processing**: Advanced audio processing with FFmpeg including:
  - Audio trimming (start time + duration)
  - Quality/bitrate adjustment (64, 128, 192, 256, 320 kbps)
  - Audio re-encoding
  - Format conversion
- **Secure Downloads**: Temporary download links with automatic expiration
- **Job Management**: Asynchronous processing with status tracking
- **Auto Cleanup**: Automatic file deletion after expiration (default 20 minutes)

### Technical Features
- **Production Ready**: PostgreSQL database with proper migrations
- **Docker Support**: Complete containerization with docker-compose
- **Rate Limiting**: Built-in protection against abuse
- **Comprehensive Logging**: Detailed logging with Winston
- **Error Handling**: Robust error handling and validation
- **Testing**: Unit and integration tests with Jest
- **Security**: Input validation, file size limits, and secure headers

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL (for local development)

### 1. Clone and Setup
```bash
git clone <repository-url>
cd yt-mp3
cp .env.example .env
# Edit .env with your configuration
```

### 2. Deploy with Docker
```bash
docker-compose up -d
```

### 3. Check Status
```bash
docker-compose ps
docker-compose logs -f backend
```

## Environment Variables

Create a `.env` file with the following configuration:

```bash
# Database Configuration
NODE_ENV=production
DB_TYPE=postgres
DB_HOST=postgres
DB_PORT=5432
DB_NAME=youtube_converter
DB_USER=postgres
DB_PASSWORD=postgres

# Server Configuration
PORT=3001

# Audio Processing
TMP_DIR=/tmp/app-media
MAX_FILE_SIZE=100000000  # 100MB

# RapidAPI Configuration
RAPIDAPI_KEY=your_rapidapi_key_here

# Performance Configuration
MAX_WORKERS=8
MAX_CONCURRENT_JOBS=20
MAX_CACHE_SIZE=1000
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
CORS_ORIGIN=https://yourdomain.com

# Frontend Configuration
VITE_API_URL=https://yourdomain.com/api
VITE_APP_NAME=YouTube to MP3 Converter
VITE_APP_VERSION=2.0.0
```

## API Endpoints

### Audio Processing Endpoints

#### Process Audio
```http
POST /api/process
Content-Type: application/json

{
  "sourceUrl": "https://nu.123tokyo.xyz/....mp3",
  "action": "trim",           // "trim" | "reencode" | "none"
  "trim": {                   // Optional, required if action is "trim"
    "start": 10,              // Start time in seconds
    "duration": 30            // Duration in seconds
  },
  "bitrate": 128,             // Optional: 64 | 128 | 192 | 256 | 320 kbps
  "expireMinutes": 20         // Optional: default 20 minutes
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "jobId": "uuid",
    "status": "processing",
    "downloadUrl": "https://.../api/download/<token>"
  }
}
```

#### Download Processed Audio
```http
GET /api/download/:token
```

**Response:** Binary MP3 file with headers:
- `Content-Type: audio/mpeg`
- `Content-Disposition: attachment; filename="processed_audio.mp3"`
- `Cache-Control: private, max-age=0, no-store`

#### Get Job Status
```http
GET /api/job/:jobId
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "ready",        // "pending" | "processing" | "ready" | "failed" | "deleted"
    "action": "trim",
    "bitrate": 128,
    "file_size": 1024000,
    "duration": 180.5,
    "created_at": "2024-01-01T00:00:00Z",
    "expires_at": "2024-01-01T00:20:00Z"
  }
}
```

### Legacy Endpoints (YouTube Conversion)
- `POST /api/check-url` - Validate YouTube URL
- `POST /api/convert` - Start YouTube conversion
- `GET /api/status/:id` - Get conversion status
- `GET /api/download/:id` - Download converted file
- `GET /api/video-info` - Get video information

### System Endpoints
- `GET /api/health` - Health check
- `GET /api/stats` - System statistics
- `GET /api/process/health` - Audio processing service health

## Usage Examples

### Basic Audio Processing
```bash
# Process audio with trimming
curl -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "sourceUrl": "https://example.com/audio.mp3",
    "action": "trim",
    "trim": {"start": 30, "duration": 60},
    "bitrate": 64,
    "expireMinutes": 30
  }'
```

### Re-encode Audio
```bash
# Re-encode with higher quality
curl -X POST http://localhost:3001/api/process \
  -H "Content-Type: application/json" \
  -d '{
    "sourceUrl": "https://example.com/audio.mp3",
    "action": "reencode",
    "bitrate": 320
  }'
```

### Check Job Status
```bash
# Get job status
curl http://localhost:3001/api/job/your-job-id
```

### Download Processed File
```bash
# Download the processed file
curl -O http://localhost:3001/api/download/your-download-token
```

## Database Schema

### Jobs Table
```sql
CREATE TABLE jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    direct_download_url TEXT,
    processed_path TEXT,
    file_size BIGINT,
    duration FLOAT,
    bitrate INT,
    action TEXT,
    trim_start FLOAT,
    trim_duration FLOAT,
    download_token TEXT UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP NOT NULL,
    error_message TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Development

### Local Development Setup

1. **Install Dependencies**
   ```bash
   cd backend
   npm install
   ```

2. **Setup Database**
   ```bash
   # Start PostgreSQL
   docker-compose up -d postgres
   
   # Run migrations
   psql -h localhost -U postgres -d youtube_converter -f migrations/001_create_jobs_table.sql
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Building for Production
```bash
npm run build
```

## Docker Configuration

### Backend Dockerfile
- Based on Node.js 18 Alpine
- Includes FFmpeg for audio processing
- Optimized multi-stage build
- Non-root user for security

### Docker Compose Services
- **postgres**: PostgreSQL 15 with health checks
- **backend**: Node.js application with FFmpeg
- **frontend**: React application
- **nginx**: Reverse proxy and static file serving

### Volume Mounts
- `./downloads:/app/downloads` - Downloaded files
- `./cache:/app/cache` - Application cache
- `./temp:/app/temp` - Temporary files
- `./logs:/app/logs` - Application logs
- `/tmp/app-media:/tmp/app-media` - Audio processing temp files

## Security Features

- **Input Validation**: Comprehensive validation of all inputs
- **File Size Limits**: Configurable maximum file sizes
- **Rate Limiting**: Per-endpoint rate limiting
- **Secure Headers**: Helmet.js security headers
- **Path Sanitization**: Protection against path traversal
- **Token-based Downloads**: Secure, expiring download tokens
- **Automatic Cleanup**: Files are automatically deleted after expiration

## Monitoring and Logging

### Logs
- **Combined Log**: `./logs/combined.log`
- **Error Log**: `./logs/error.log`
- **Structured Logging**: JSON format with metadata

### Health Checks
- **Backend**: `GET /api/health`
- **Audio Processing**: `GET /api/process/health`
- **Database**: Built-in PostgreSQL health checks

### Metrics
- Job processing statistics
- File cleanup metrics
- Error rates and response times

## Troubleshooting

### Common Issues

1. **FFmpeg Not Found**
   ```bash
   # Check if FFmpeg is installed in container
   docker-compose exec backend ffmpeg -version
   ```

2. **Database Connection Issues**
   ```bash
   # Check PostgreSQL logs
   docker-compose logs postgres
   
   # Test connection
   docker-compose exec backend psql -h postgres -U postgres -d youtube_converter
   ```

3. **File Permission Issues**
   ```bash
   # Fix permissions
   sudo chown -R 1001:1001 ./downloads ./cache ./temp ./logs
   ```

4. **Rate Limiting**
   - Check rate limit configuration in `.env`
   - Monitor logs for rate limit violations
   - Adjust limits based on usage patterns

### Debug Mode
```bash
# Enable debug logging
LOG_LEVEL=debug docker-compose up
```

## Performance Optimization

### Recommended Settings
- **MAX_WORKERS**: 4-8 (depending on CPU cores)
- **MAX_CONCURRENT_JOBS**: 10-20 (depending on memory)
- **MAX_CACHE_SIZE**: 500-1000 (depending on available memory)
- **CACHE_TTL**: 3600000 (1 hour)

### Resource Limits
```yaml
# In docker-compose.yml
deploy:
  resources:
    limits:
      cpus: '1.5'
      memory: 2G
    reservations:
      cpus: '1'
      memory: 1G
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Run the test suite
6. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
1. Check the logs first
2. Review the troubleshooting section
3. Check environment variables
4. Verify Docker setup
5. Create an issue with detailed information
