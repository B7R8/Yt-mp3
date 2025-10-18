# YouTube→MP3 RapidAPI-Only Deployment Guide

This guide covers the deployment of the cleaned YouTube→MP3 converter that uses only RapidAPI for conversions, with direct download links and no local file processing.

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose
- RapidAPI key(s) for YouTube MP3 conversion
- PostgreSQL database (or use the included Docker setup)

### Environment Variables
Create a `.env` file in the project root:

```bash
# Required - Primary RapidAPI key
RAPIDAPI_KEY=your_rapidapi_key_here

# Optional - Additional keys for automatic fallback
# The system will automatically switch to the next key if one fails or reaches its limit
# No user-side notifications or errors will appear during key switching
RAPIDAPI_KEY2=your_second_key
RAPIDAPI_KEY3=your_third_key
RAPIDAPI_KEY4=your_fourth_key
RAPIDAPI_KEY5=your_fifth_key

# Database (if not using Docker)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=youtube_converter
DB_USER=postgres
DB_PASSWORD=your_password

# Application
PORT=3001
NODE_ENV=production
MAX_CONCURRENT_JOBS=5
```

### Deploy with Docker

1. **Build and start services:**
```bash
docker-compose build --no-cache
docker-compose up -d
```

2. **Check logs:**
```bash
docker-compose logs -f backend
```

3. **Verify deployment:**
```bash
curl http://localhost/api/health
```

## 🔑 Multi-Key Fallback System

The system includes a robust multi-key fallback mechanism that automatically handles API key failures and quota limits:

### How It Works
1. **Automatic Key Loading**: The system loads all available keys from environment variables
2. **Seamless Switching**: If one key fails or reaches its limit, it automatically switches to the next available key
3. **No User Impact**: Users never see errors or notifications about key switching
4. **Transparent Operation**: The conversion process continues uninterrupted

### Key Configuration
```bash
# Primary key (required)
RAPIDAPI_KEY=your_primary_key

# Backup keys (optional but recommended)
RAPIDAPI_KEY2=your_backup_key_1
RAPIDAPI_KEY3=your_backup_key_2
RAPIDAPI_KEY4=your_backup_key_3
RAPIDAPI_KEY5=your_backup_key_4
```

### Benefits
- **High Availability**: Multiple keys ensure service continuity
- **Quota Management**: Distributes load across multiple API keys
- **Fault Tolerance**: Automatic recovery from key failures
- **Cost Optimization**: Better quota utilization across keys

### Monitoring
The system logs key switching events for monitoring:
```
🔑 Attempting conversion with API key 1 of 3
⚠️ API key 1 failed, switching to API key 2 of 3
✅ Valid download URL obtained with API key 2
```

## 🔧 Manual Deployment

### Backend Setup

1. **Install dependencies:**
```bash
cd backend
npm install --production
```

2. **Build the application:**
```bash
npm run build
```

3. **Run database migration:**
```bash
# For PostgreSQL
psql -h localhost -U postgres -d youtube_converter -f migrations/004_create_videos_table_rapidapi.sql
```

4. **Start the backend:**
```bash
npm start
```

### Frontend Setup

1. **Install dependencies:**
```bash
cd frontend
npm install
```

2. **Build for production:**
```bash
npm run build
```

3. **Serve with nginx or any web server:**
```bash
# Example with nginx
sudo cp -r dist/* /var/www/html/
```

## 🗄️ Database Schema

The new schema uses a single `videos` table:

```sql
CREATE TABLE videos (
  id SERIAL PRIMARY KEY,
  video_id TEXT UNIQUE NOT NULL,
  title TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  progress INT DEFAULT 0,
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
```

## 🔄 API Endpoints

### Convert Video
```bash
POST /api/convert
Content-Type: application/json

{
  "url": "https://youtube.com/watch?v=VIDEO_ID",
  "quality": "128k"
}
```

Response:
```json
{
  "success": true,
  "id": "123",
  "status": "pending",
  "title": "Video Title",
  "message": "Conversion job started successfully"
}
```

### Check Status
```bash
GET /api/status/123
```

Response:
```json
{
  "success": true,
  "jobId": "123",
  "status": "done",
  "title": "Video Title",
  "download_url": "https://rapidapi-direct-link.com/file.mp3",
  "file_size": 5242880
}
```

### Get Status by Video ID
```bash
GET /api/status?video_id=VIDEO_ID
```

### Download File
```bash
GET /api/download/123
# Returns 302 redirect to direct download URL
```

## 🧹 Cleanup and Maintenance

### Automatic Cleanup
The system automatically cleans up:
- Completed videos older than 7 days
- Failed jobs older than 1 day
- Expired download URLs

### Manual Cleanup
```bash
# Run cleanup function
psql -d youtube_converter -c "SELECT cleanup_expired_videos();"
```

### Monitor Active Conversions
```sql
SELECT * FROM active_conversions;
```

## 🔒 Security Features

- **One request per video**: Prevents duplicate conversions
- **Rate limiting**: Built-in rate limiting on all endpoints
- **Input validation**: Comprehensive URL and input validation
- **Direct downloads**: No file storage on server
- **Automatic expiration**: Download URLs expire after 7 days

## 🚨 Troubleshooting

### Common Issues

1. **RapidAPI Key Issues:**
```bash
# Check if key is set
echo $RAPIDAPI_KEY

# Test API key
curl -H "X-RapidAPI-Key: $RAPIDAPI_KEY" \
     -H "X-RapidAPI-Host: youtube-mp36.p.rapidapi.com" \
     "https://youtube-mp36.p.rapidapi.com/dl?id=dQw4w9WgXcQ"
```

2. **Database Connection Issues:**
```bash
# Test PostgreSQL connection
pg_isready -h localhost -p 5432 -U postgres

# Check database exists
psql -h localhost -U postgres -l
```

3. **Conversion Failures:**
- Check RapidAPI quota
- Verify video URL format
- Check logs for specific error messages

### Logs
```bash
# Backend logs
docker-compose logs -f backend

# Database logs
docker-compose logs -f postgres

# All services
docker-compose logs -f
```

## 📊 Monitoring

### Health Checks
```bash
# Application health
curl http://localhost/api/health

# Database health
curl http://localhost/api/stats
```

### Performance Metrics
- Conversion success rate
- Average processing time
- Active concurrent jobs
- Database query performance

## 🔄 Migration from Old System

If migrating from the old ffmpeg/yt-dlp system:

1. **Backup existing data:**
```bash
pg_dump youtube_converter > backup.sql
```

2. **Run cleanup script:**
```bash
# Windows
powershell -ExecutionPolicy Bypass -File backend/scripts/cleanup-rapidapi.ps1

# Linux/Mac
bash backend/scripts/cleanup-rapidapi.sh
```

3. **Deploy new system:**
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## 🎯 Testing

### Test Conversion Flow
```bash
# 1. Start conversion
curl -X POST http://localhost/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ"}'

# 2. Check status (use job ID from step 1)
curl http://localhost/api/status/JOB_ID

# 3. Download file
curl -L http://localhost/api/download/JOB_ID -o test.mp3
```

### Test Idempotency
```bash
# Run same conversion twice - should return existing job
curl -X POST http://localhost/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ"}'
```

## 📈 Scaling

### Horizontal Scaling
- Use load balancer in front of multiple backend instances
- Ensure all instances share the same database
- Configure sticky sessions if needed

### Database Optimization
- Add indexes for frequently queried columns
- Consider read replicas for status checks
- Monitor query performance

### RapidAPI Optimization
- Use multiple API keys for higher quotas
- Implement intelligent fallback between keys
- Monitor API usage and costs

## 🆘 Support

For issues or questions:
1. Check the logs first
2. Verify environment variables
3. Test API endpoints manually
4. Check database connectivity
5. Review RapidAPI quota and status

## 📝 Changelog

### v2.0.0 - RapidAPI-Only Mode
- ✅ Removed ffmpeg and yt-dlp dependencies
- ✅ Implemented direct download links
- ✅ Added one-request-per-video policy
- ✅ Simplified database schema
- ✅ Updated Docker configuration
- ✅ Enhanced error handling
- ✅ Added automatic cleanup
- ✅ Improved security and validation
