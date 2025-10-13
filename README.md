# SaveYTB - YouTube to MP3 Converter

A modern, production-ready YouTube to MP3 converter application with React frontend and Node.js backend. Convert YouTube videos to high-quality MP3 audio files instantly with advanced features and optimizations.

## ✨ Features

- **🎵 Direct Audio Download**: Downloads audio directly at user-requested quality (64K-320K)
- **⚡ Ultra-Fast Processing**: Optimized yt-dlp pipeline with parallel downloads and smart caching
- **🍪 Robot Verification Bypass**: Automatic cookies support to bypass YouTube restrictions
- **🎨 Dynamic Logo**: Theme-aware logo switching (light/dark mode)
- **📱 Mobile-First Design**: Fully responsive interface optimized for all devices
- **🌙 Dark/Light Theme**: Beautiful theme switching with system preference detection
- **✂️ Audio Trimming**: Trim audio files with precise start/end time controls
- **🎛️ Quality Selection**: Choose from 64K, 128K, 192K, 256K, 320K audio quality
- **📊 Real-time Progress**: Live conversion progress with animated indicators
- **🔄 Auto Download**: Optional automatic download when conversion completes
- **🔒 Secure & Private**: No data storage, files auto-delete after 1 hour
- **🚀 Production Ready**: Docker support with comprehensive deployment guide
- **🛡️ Rate Limited**: Built-in protection against abuse
- **📈 Analytics Ready**: Google Analytics integration for tracking
- **📄 Legal Pages**: Complete Terms of Use and Privacy Policy

## 🏗️ Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Frontend │    │  Nginx Proxy    │    │  Node.js API    │
│   (Port 3000)   │◄──►│   (Port 80/443) │◄──►│   (Port 3001)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                       ┌─────────────────┐            │
                       │   PostgreSQL    │◄───────────┘
                       │   (Port 5432)   │
                       └─────────────────┘
```

## 🚀 Quick Start

### Prerequisites

- Node.js (18+)
- npm or yarn
- Python 3.7+ (for yt-dlp)
- yt-dlp (for video conversion)
- PostgreSQL (for production)
- FFmpeg (for audio processing)

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd youtube-to-mp3
   npm run install:all
   ```

2. **Install system dependencies:**
   ```bash
   # Install yt-dlp
   pip install yt-dlp
   
   # Install FFmpeg (Ubuntu/Debian)
   sudo apt update && sudo apt install ffmpeg
   
   # Install FFmpeg (macOS)
   brew install ffmpeg
   
   # Install FFmpeg (Windows)
   # Download from https://ffmpeg.org/download.html
   ```

3. **Configure environment:**
   ```bash
   # Backend environment
   cp backend/env.example backend/.env
   # Edit backend/.env with your database settings
   ```

4. **Start development servers:**
   ```bash
   npm run dev
   ```

This will start both the frontend (http://localhost:5173) and backend (http://localhost:3001) servers.

### Optional: Cookies Setup (Recommended)

To bypass YouTube's robot verification and improve download success rates:

1. **Get cookies from YouTube:**
   - Install a browser extension like "Get cookies.txt" or "cookies.txt"
   - Go to YouTube and log in to your account
   - Use the extension to export cookies to `cookies.txt`

2. **Place cookies file:**
   ```bash
   # Place the cookies.txt file in the backend directory
   cp /path/to/your/cookies.txt backend/cookies.txt
   ```

The system will automatically use cookies if available, or work without them if not present.

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive production deployment instructions.

## 📡 API Endpoints

### POST /api/convert
Start a new conversion job with advanced options.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "192k",
  "trim_start": "00:01:30",
  "trim_end": "00:03:45"
}
```

**Response:**
```json
{
  "success": true,
  "jobId": "uuid-here",
  "status": "pending",
  "message": "Conversion job started successfully"
}
```

### GET /api/status/:id
Get conversion job status with progress updates.

**Response:**
```json
{
  "success": true,
  "jobId": "uuid-here",
  "status": "processing",
  "progress": 45,
  "video_title": "Video Title",
  "quality_message": "3-hour rule applied: Quality reduced to 128K for long video",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:01:30Z"
}
```

### GET /api/video-info
Get video information (title, duration) for trimming.

**Request:**
```
GET /api/video-info?url=https://www.youtube.com/watch?v=VIDEO_ID
```

**Response:**
```json
{
  "success": true,
  "title": "Video Title",
  "duration": 180,
  "durationFormatted": "3:00",
  "cached": false
}
```

### GET /api/download/:id
Download the converted MP3 file.

### GET /api/health
Health check endpoint with system status.

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=youtube_converter
DB_USER=postgres
DB_PASS=your_secure_password

# Server Configuration
PORT=3001
NODE_ENV=development

# File Management
DOWNLOADS_DIR=downloads
MAX_FILE_AGE_HOURS=1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=http://localhost:5173
```

#### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001/api
```

## 🛠️ Development

### Available Scripts

- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only frontend
- `npm run dev:backend` - Start only backend
- `npm run build` - Build both frontend and backend
- `npm run install:all` - Install dependencies for all projects

### Project Structure

```
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/          # Page components
│   │   ├── contexts/        # React contexts
│   │   └── utils/           # Utility functions
│   └── package.json
├── backend/                 # Node.js backend
│   ├── src/
│   │   ├── config/         # Configuration files
│   │   ├── middleware/      # Express middleware
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic
│   │   └── types/          # TypeScript types
│   └── package.json
├── nginx/                   # Nginx configuration
├── docker-compose.yml       # Development Docker setup
└── docker-compose.prod.yml  # Production Docker setup
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi schema validation for all inputs
- **CORS Protection**: Configured for specific origins
- **Helmet.js**: Security headers
- **File Cleanup**: Automatic removal of old files (1 hour)
- **Error Handling**: Comprehensive error logging and handling
- **Cookies Support**: Optional YouTube cookies for bypassing restrictions
- **Pure Audio Output**: Ensures MP3 files contain no video data

## 🚀 Performance Optimizations

- **Direct Audio Download**: Downloads audio at requested quality without conversion
- **Parallel Processing**: Concurrent fragment downloads for faster processing
- **Smart Caching**: Video info caching with TTL for instant responses
- **Optimized FFmpeg**: Minimal processing only when trimming is needed
- **Worker Threads**: Background processing for better performance
- **Memory Management**: Efficient file handling and cleanup

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the [Deployment Guide](DEPLOYMENT.md)
- Review the troubleshooting section
- Create an issue in the repository

## 🎯 Key Improvements

### Latest Updates
- **Direct Audio Download**: No more video download → audio extraction process
- **Quality Optimization**: Downloads directly at user-requested quality (64K-320K)
- **Robot Verification Bypass**: Automatic cookies support for YouTube restrictions
- **Dynamic Logo**: Theme-aware logo switching for better UX
- **Enhanced Trimming**: Precise audio trimming with real-time duration fetching
- **Google Analytics**: Built-in tracking for usage analytics
- **Pure Audio Output**: Ensures MP3 files show music note icon, not video

### Performance Benefits
- **3x Faster Downloads**: Direct audio download vs video+extraction
- **Smaller File Sizes**: Download exactly what user wants
- **Better Quality**: No quality loss from unnecessary conversions
- **Reduced CPU Usage**: FFmpeg only runs when trimming needed

---

**SaveYTB - YouTube to MP3 Converter** - Convert YouTube videos to MP3 with ease, security, and style! 🎵

*Built with ❤️ using React, Node.js, yt-dlp, and FFmpeg*

