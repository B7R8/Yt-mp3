# Deployment Guide

This guide covers deploying the YouTube to MP3 Converter application in production.

## 🚀 Quick Production Deployment

### Prerequisites

- Docker (20.10+)
- Docker Compose (2.0+)
- At least 2GB RAM
- 10GB free disk space

### 1. Clone and Setup

```bash
git clone <your-repo-url>
cd youtube-to-mp3
```

### 2. Configure Environment

```bash
# Copy the production environment template
cp production.env.example .env

# Edit the environment file with your production values
nano .env
```

**Required Environment Variables:**
- `DB_PASS`: Secure password for PostgreSQL database
- `FRONTEND_URL`: Your domain URL (e.g., https://audioflow.com)
- `VITE_API_URL`: Your API URL (e.g., https://api.audioflow.com)

### 3. Deploy

```bash
# Create necessary directories
mkdir -p downloads nginx/ssl logs

# Start services
docker-compose -f docker-compose.prod.yml up --build -d

# Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Check status
docker-compose -f docker-compose.prod.yml ps
```

## 🐳 Manual Deployment

If you prefer manual deployment:

```bash
# 1. Create directories
mkdir -p downloads nginx/ssl logs

# 2. Start services
docker-compose -f docker-compose.prod.yml up --build -d

# 3. Run migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# 4. Check status
docker-compose -f docker-compose.prod.yml ps
```

## 🌐 Service URLs

After deployment, your services will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:3001/api
- **Health Check**: http://localhost:3001/api/health

## 🔧 Configuration

### Environment Variables

#### Backend (.env)
```env
# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=audioflow_prod
DB_USER=audioflow_user
DB_PASS=your_secure_password

# Server Configuration
PORT=3001
NODE_ENV=production

# File Management
DOWNLOADS_DIR=downloads
MAX_FILE_AGE_HOURS=1

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# CORS
FRONTEND_URL=https://your-domain.com
```

#### Frontend (.env)
```env
VITE_API_URL=https://your-api-domain.com/api
```

## 🔒 Security Features

- **Rate Limiting**: 100 requests per 15 minutes per IP
- **Input Validation**: Joi schema validation for all inputs
- **CORS Protection**: Configured for specific origins
- **Helmet.js**: Security headers
- **File Cleanup**: Automatic removal of old files (1 hour)
- **Error Handling**: Comprehensive error logging and handling

## 📊 Monitoring and Maintenance

### Health Checks
All services include health checks:
- Database: PostgreSQL connection check
- Backend: API health endpoint
- Frontend: HTTP response check

### Logs
```bash
# All services
docker-compose -f docker-compose.prod.yml logs -f

# Specific service
docker-compose -f docker-compose.prod.yml logs -f backend
```

### Backup
```bash
# Database backup
docker-compose -f docker-compose.prod.yml exec db pg_dump -U audioflow_user audioflow_prod > backup.sql

# File backup
tar -czf downloads-backup.tar.gz downloads/
```

## 🛠️ Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   lsof -i :3000
   lsof -i :3001
   ```

2. **Database Connection Issues**
   ```bash
   docker-compose -f docker-compose.prod.yml logs db
   ```

3. **Permission Issues**
   ```bash
   sudo chown -R $USER:$USER downloads/
   chmod 755 downloads/
   ```

## 📈 Performance Optimization

- Use SSD storage for better I/O performance
- Configure appropriate file system permissions
- Monitor disk space usage
- Use CDN for static assets
- Configure proper caching headers

## 🔄 Updates

To update the application:

```bash
# 1. Pull latest changes
git pull origin main

# 2. Rebuild and restart services
docker-compose -f docker-compose.prod.yml up --build -d

# 3. Run any new migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate
```

## 📄 Documentation

- [API Documentation](docs/API.md) - Detailed API reference
- [Contributing Guide](CONTRIBUTING.md) - How to contribute to the project

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
- Check the troubleshooting section
- Create an issue in the repository

---

**AudioFlow** - Convert YouTube videos to MP3 with ease, security, and style! 🎵

