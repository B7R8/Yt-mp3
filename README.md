# YouTube to MP3 Converter

A modern, production-ready YouTube to MP3 converter application with React frontend and Node.js backend.

## ✨ Features

- **🎵 High-Quality Conversion**: Convert YouTube videos to MP3 with excellent audio quality
- **📱 Mobile-First Design**: Fully responsive interface optimized for all devices
- **🌙 Dark/Light Theme**: Beautiful theme switching with system preference detection
- **⚡ Fast Processing**: Optimized conversion pipeline for quick results
- **🔒 Secure & Private**: No data storage, files auto-delete after 1 hour
- **🚀 Production Ready**: Docker support with comprehensive deployment guide
- **📊 Real-time Status**: Live conversion progress updates
- **🎯 Simple Interface**: Clean, intuitive user experience
- **🛡️ Rate Limited**: Built-in protection against abuse
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
- PostgreSQL (for production)
- yt-dlp (for video conversion)

### Development Setup

1. **Clone and install dependencies:**
   ```bash
   git clone <your-repo-url>
   cd youtube-to-mp3
   npm run install:all
   ```

2. **Configure environment:**
   ```bash
   # Backend environment
   cp backend/env.example backend/.env
   # Edit backend/.env with your database settings
   ```

3. **Start development servers:**
   ```bash
   npm run dev
   ```

This will start both the frontend (http://localhost:5173) and backend (http://localhost:3001) servers.

### Production Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for comprehensive production deployment instructions.

## 📡 API Endpoints

### POST /api/convert
Start a new conversion job.

**Request:**
```json
{
  "url": "https://www.youtube.com/watch?v=VIDEO_ID",
  "quality": "192k"
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
Get conversion job status.

**Response:**
```json
{
  "success": true,
  "jobId": "uuid-here",
  "status": "completed",
  "video_title": "Video Title",
  "mp3_filename": "uuid-here.mp3",
  "created_at": "2024-01-01T00:00:00Z",
  "updated_at": "2024-01-01T00:01:30Z"
}
```

### GET /api/download/:id
Download the converted MP3 file.

### GET /api/health
Health check endpoint.

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

---

**YouTube to MP3 Converter** - Convert YouTube videos to MP3 with ease, security, and style! 🎵

