# YouTube to MP3 Converter - Backend Implementation Guide

## Overview
This backend service provides a robust Express.js API for converting YouTube videos to high-quality MP3 files with support for audio trimming and bitrate selection.

## Tech Stack
- **Framework**: Node.js with Express.js
- **Download Tool**: `yt-dlp` (YouTube audio downloader)
- **Audio Processing**: `fluent-ffmpeg` (Node.js wrapper for FFmpeg)
- **Database**: SQLite (for job tracking)
- **Logging**: Winston

## Prerequisites
Before running this service, ensure you have the following installed on your server:

1. **Node.js** (v18 or higher)
2. **yt-dlp**: Install globally
   ```bash
   # On Windows
   pip install yt-dlp
   
   # On Linux/Mac
   python3 -m pip install yt-dlp
   ```
3. **FFmpeg**: Must be available in system PATH
   ```bash
   # On Windows - Download from ffmpeg.org
   # On Linux
   sudo apt-get install ffmpeg
   
   # On Mac
   brew install ffmpeg
   ```

## Installation

```bash
cd backend
npm install
```

## Environment Variables

Create a `.env` file in the backend directory:

```env
PORT=5000
NODE_ENV=development
DOWNLOADS_DIR=./downloads
MAX_FILE_AGE_HOURS=1
LOG_LEVEL=info
```

## API Endpoints

### 1. Convert YouTube to MP3

**Endpoint**: `POST /api/convert`

**Request Body**:
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "192k",
  "trim_start": "00:00:30",
  "trim_end": "00:02:45"
}
```

**Parameters**:
- `url` (required): Full YouTube video URL
- `quality` (optional): Audio bitrate (64k, 128k, 192k, 256k, 320k). Default: 192k
- `trim_start` (optional): Start time in HH:mm:ss format
- `trim_end` (optional): End time in HH:mm:ss format

**Success Response** (202 Accepted):
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Conversion job started successfully"
}
```

**Error Response** (400/500):
```json
{
  "success": false,
  "message": "Error description"
}
```

### 2. Check Conversion Status

**Endpoint**: `GET /api/status/:jobId`

**Success Response**:
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "video_title": "Video Title",
  "mp3_filename": "550e8400-e29b-41d4-a716-446655440000.mp3",
  "error_message": null,
  "created_at": "2024-01-01T12:00:00.000Z",
  "updated_at": "2024-01-01T12:05:00.000Z"
}
```

**Status Values**:
- `pending`: Job is queued
- `processing`: Conversion in progress
- `completed`: Conversion successful, file ready for download
- `failed`: Conversion failed
- `cleaned`: File was cleaned up after expiry

### 3. Download Converted File

**Endpoint**: `GET /api/download/:jobId`

**Success Response**: Direct file download (audio/mpeg)

**Headers Set**:
- `Content-Type`: audio/mpeg
- `Content-Disposition`: attachment; filename="video_title.mp3"
- `Content-Length`: file size in bytes

## Conversion Process Flow

### Step-by-Step Logic:

1. **Job Creation**
   - Generate unique job ID (UUID)
   - Extract video title using yt-dlp
   - Save job to database with status 'pending'
   - Start async conversion process
   - Return job ID immediately to client

2. **Audio Download** (using yt-dlp)
   - Execute yt-dlp as child process
   - Download best available audio format
   - Convert to MP3 during download
   - Save to temporary file: `{jobId}_temp.mp3`

3. **Audio Processing** (using fluent-ffmpeg)
   - Load downloaded audio file
   - Apply trimming if start/end times provided:
     - Set start time with `setStartTime()`
     - Calculate and set duration
   - Apply bitrate conversion with `audioBitrate()`
   - Output to final file: `{jobId}.mp3`
   - Monitor progress with event handlers

4. **Cleanup & Completion**
   - Delete temporary download file
   - Update job status to 'completed'
   - Store final filename in database

5. **Error Handling**
   - Catch errors at each step
   - Clean up temporary files
   - Update job status to 'failed'
   - Log detailed error messages

## Code Architecture

### ConversionService Methods

#### `createJob(request: ConversionRequest): Promise<string>`
Creates a new conversion job and returns job ID immediately.

#### `processConversion(jobId: string, request: ConversionRequest): Promise<void>`
Main conversion orchestrator:
- Downloads audio
- Processes with FFmpeg
- Handles cleanup

#### `downloadAudio(url: string, outputPath: string): Promise<string>`
Downloads audio using yt-dlp:
```typescript
python -m yt_dlp -f bestaudio --extract-audio --audio-format mp3 --output {path} --no-playlist {url}
```

#### `processAudioWithFFmpeg(inputPath, outputPath, bitrate, startTime?, endTime?): Promise<void>`
Processes audio with FFmpeg:
- Trims audio to specified time range
- Converts to specified bitrate
- Outputs MP3 format

#### `timeToSeconds(timeStr: string): number`
Converts HH:mm:ss format to seconds for duration calculation.

## Error Handling

### Download Errors
- Invalid YouTube URL
- Video unavailable
- Network issues
- yt-dlp not installed

### Processing Errors
- FFmpeg errors
- Invalid time ranges
- Disk space issues
- Codec problems

### All errors are:
1. Logged with Winston
2. Stored in database with job
3. Returned to client via status endpoint

## File Cleanup

Automatic cleanup runs every hour (configurable via cron):
- Deletes files older than `MAX_FILE_AGE_HOURS`
- Updates job status to 'cleaned'
- Prevents disk space issues

## Rate Limiting

- **Convert endpoint**: 10 requests per 15 minutes per IP
- **Status endpoint**: 30 requests per 15 minutes per IP
- **Download endpoint**: No rate limit (authenticated by job ID)

## Security Features

1. **Input Validation**: Joi schema validation
2. **Helmet.js**: Security headers
3. **CORS**: Configurable origins
4. **Rate Limiting**: Prevents abuse
5. **File Access Control**: Jobs can only download their own files

## Logging

Winston logger with two transports:
- **Console**: Development logging
- **File**: 
  - `error.log`: Error messages only
  - `combined.log`: All log levels

Log format includes:
- Timestamp
- Log level
- Message
- Stack trace (for errors)

## Database Schema

```sql
CREATE TABLE conversions (
  id TEXT PRIMARY KEY,
  youtube_url TEXT NOT NULL,
  video_title TEXT,
  status TEXT NOT NULL,
  mp3_filename TEXT,
  error_message TEXT,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL
);
```

## Running the Service

### Development
```bash
npm run dev
```

### Production
```bash
npm run build
npm start
```

## Testing the API

### Using cURL:

```bash
# Start conversion
curl -X POST http://localhost:5000/api/convert \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    "quality": "192k",
    "trim_start": "00:00:10",
    "trim_end": "00:01:30"
  }'

# Check status
curl http://localhost:5000/api/status/{jobId}

# Download file
curl -O http://localhost:5000/api/download/{jobId}
```

## Performance Considerations

1. **Async Processing**: Conversions run asynchronously to avoid blocking
2. **Streaming**: Files are streamed to clients, not loaded into memory
3. **Cleanup**: Old files are automatically deleted
4. **Database Indexing**: Job IDs are primary keys for fast lookups

## Troubleshooting

### yt-dlp not found
```bash
# Verify installation
python -m yt_dlp --version

# Add to PATH if needed
export PATH=$PATH:/path/to/python/Scripts
```

### FFmpeg not found
```bash
# Verify installation
ffmpeg -version

# Add to PATH if needed
```

### File not created
- Check disk space
- Verify write permissions on downloads directory
- Check logs for detailed error messages

## Future Enhancements

1. **Progress Tracking**: Real-time progress updates via WebSocket
2. **Batch Processing**: Convert multiple videos in one request
3. **Cloud Storage**: Upload to S3/Azure instead of local storage
4. **Authentication**: User accounts and API keys
5. **Queue System**: Redis-based job queue for scalability

## License
MIT

## Support
For issues and questions, please refer to the project repository.

