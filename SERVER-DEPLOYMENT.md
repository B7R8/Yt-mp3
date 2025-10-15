# YouTube-to-MP3 Converter - Server Deployment Guide

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB RAM and 5GB disk space
- Linux/Unix server (Ubuntu 20.04+ recommended)

### 1. Clone and Setup
```bash
git clone <your-repo-url>
cd Yt-mp3
```

### 2. Configure Environment
```bash
# Copy the production environment file
cp env.production .env

# Edit the configuration
nano .env
```

### 3. Deploy
```bash
# Make deployment script executable
chmod +x deploy-server.sh

# Run deployment
./deploy-server.sh
```

## 📋 Configuration

### Environment Variables (env.production)

#### Database Configuration
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=ytmp3
DB_USER=ytmp3_user
DB_PASSWORD=ytmp3_secure_password_2024
```

#### Redis Configuration
```env
REDIS_HOST=redis
REDIS_PORT=6379
```

#### Application Configuration
```env
NODE_ENV=production
PORT=3001
MAX_WORKERS=8
MAX_CONCURRENT_JOBS=20
```

#### Security Configuration
```env
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
SESSION_SECRET=your_session_secret_key_here_change_this_in_production
```

## 🔧 Services

### Core Services
- **Frontend**: React app on port 3000
- **Backend**: Node.js API on port 3001
- **PostgreSQL**: Database on port 5432
- **Redis**: Cache on port 6379
- **Nginx**: Reverse proxy on port 80

### Monitoring
- **Grafana**: Dashboard on port 3002 (admin/admin)

## 📊 Health Checks

### Service URLs
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001/api/health
- Grafana: http://localhost:3002
- Nginx: http://localhost

### Health Check Commands
```bash
# Check all services
docker-compose ps

# Check specific service logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres
docker-compose logs -f redis
```

## 🛠️ Management Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### Restart Services
```bash
docker-compose restart
```

### Update Services
```bash
docker-compose pull
docker-compose up -d
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
```

## 🔒 Security Configuration

### 1. Change Default Passwords
Edit `env.production` and change:
- `DB_PASSWORD`
- `JWT_SECRET`
- `SESSION_SECRET`
- `GRAFANA_ADMIN_PASSWORD`

### 2. SSL Configuration
For production with SSL:
```env
SSL_ENABLED=true
SSL_CERT_PATH=/etc/nginx/ssl/cert.pem
SSL_KEY_PATH=/etc/nginx/ssl/key.pem
```

### 3. Firewall Rules
```bash
# Allow HTTP/HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH (if needed)
sudo ufw allow 22

# Enable firewall
sudo ufw enable
```

## 📁 File Structure

```
Yt-mp3/
├── env.production          # Environment configuration
├── docker-compose.yml      # Docker services
├── deploy-server.sh        # Deployment script
├── backend/
│   ├── Dockerfile         # Backend container
│   └── src/               # Backend source code
├── frontend/
│   ├── Dockerfile         # Frontend container
│   └── src/               # Frontend source code
├── nginx/
│   └── nginx.conf         # Nginx configuration
├── downloads/             # Downloaded files
├── cache/                 # Application cache
├── temp/                  # Temporary files
└── logs/                  # Application logs
```

## 🔄 Backup and Maintenance

### Database Backup
```bash
# Create backup
docker-compose exec postgres pg_dump -U ytmp3_user ytmp3 > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore backup
docker-compose exec -T postgres psql -U ytmp3_user ytmp3 < backup_file.sql
```

### Log Rotation
```bash
# Clean old logs
docker-compose exec backend find /app/logs -name "*.log" -mtime +7 -delete
```

### Cache Cleanup
```bash
# Clean old cache files
docker-compose exec backend find /app/cache -type f -mtime +1 -delete
```

## 🚨 Troubleshooting

### Common Issues

#### 1. Port Already in Use
```bash
# Check what's using the port
sudo netstat -tulpn | grep :3001

# Kill the process
sudo kill -9 <PID>
```

#### 2. Database Connection Failed
```bash
# Check PostgreSQL logs
docker-compose logs postgres

# Restart PostgreSQL
docker-compose restart postgres
```

#### 3. Out of Disk Space
```bash
# Clean Docker system
docker system prune -a

# Clean old downloads
docker-compose exec backend find /app/downloads -type f -mtime +1 -delete
```

#### 4. Memory Issues
```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart
```

### Log Locations
- Application logs: `./logs/`
- Docker logs: `docker-compose logs [service]`
- System logs: `/var/log/`

## 📈 Performance Optimization

### 1. Resource Limits
Edit `docker-compose.yml` to adjust resource limits:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
```

### 2. Database Optimization
```sql
-- Connect to PostgreSQL
docker-compose exec postgres psql -U ytmp3_user ytmp3

-- Optimize database
VACUUM ANALYZE;
```

### 3. Redis Optimization
```bash
# Check Redis memory usage
docker-compose exec redis redis-cli info memory
```

## 🔄 Updates

### Update Application
```bash
# Pull latest changes
git pull origin main

# Rebuild and restart
docker-compose build --no-cache
docker-compose up -d
```

### Update Dependencies
```bash
# Update Docker images
docker-compose pull
docker-compose up -d
```

## 📞 Support

For issues and support:
1. Check logs: `docker-compose logs -f`
2. Check health: `curl http://localhost:3001/api/health`
3. Check system resources: `docker stats`
4. Review this documentation

---

**Happy converting! 🎵**
