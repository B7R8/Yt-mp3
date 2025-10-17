# 🚀 YouTube to MP3 Converter - Deployment Guide

## 📋 **Prerequisites**

- Docker and Docker Compose installed
- At least 2GB RAM and 5GB disk space
- Domain name (for production)
- SSL certificates (for production)

## 🎯 **Deployment Options**

### **1. Quick Development Deployment**
For testing and development:

```bash
# Quick start (Windows PowerShell)
docker-compose down --remove-orphans
docker-compose up -d --build

# Or use the quick script (Linux/Mac)
./deploy-quick.sh
```

### **2. Full Development Deployment**
For complete development setup:

```bash
# Windows PowerShell
.\deploy.ps1

# Linux/Mac
./deploy.sh
```

### **3. Production Deployment**
For production with SSL and optimizations:

```bash
# Windows PowerShell
.\deploy-production.ps1

# Linux/Mac
./deploy-production.sh
```

## 🔧 **Manual Deployment Commands**

### **Step 1: Prepare Environment**
```bash
# Create necessary directories
mkdir -p downloads cache temp logs nginx/ssl

# Copy environment file
copy env.template .env
# Edit .env with your configuration
```

### **Step 2: Build and Deploy**
```bash
# Stop existing containers
docker-compose down --remove-orphans

# Build images
docker-compose build --no-cache

# Start services
docker-compose up -d
```

### **Step 3: Verify Deployment**
```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Test endpoints
curl http://localhost/api/health
curl http://localhost/
```

## 📁 **Updated Docker Files**

### **Frontend Dockerfile** ✅
- Multi-stage build with Node.js 18 Alpine
- Includes Tailwind CSS and PostCSS configuration
- Optimized Nginx production stage
- Health checks and security optimizations

### **Backend Dockerfile** ✅
- Multi-stage build with Node.js 18 Alpine
- Includes FFmpeg and yt-dlp
- PostgreSQL client and runtime dependencies
- Proper user permissions and security

### **Docker Compose** ✅
- Updated to use optimized Nginx configuration
- Resource limits and health checks
- Proper networking and volume mounts
- Production-ready environment variables

## 🌐 **Nginx Configuration**

### **Optimized Nginx Config** ✅
- Advanced caching headers
- Gzip and Brotli compression
- Security headers
- Rate limiting
- SSL/TLS configuration

## 🚀 **Deployment Commands**

### **Windows PowerShell Commands:**

```powershell
# Quick deployment
docker-compose down --remove-orphans; docker-compose up -d --build

# Full deployment
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f

# Stop services
docker-compose down

# Restart services
docker-compose restart

# Update services
docker-compose pull
docker-compose up -d --build
```

### **Linux/Mac Commands:**

```bash
# Quick deployment
./deploy-quick.sh

# Full deployment
./deploy.sh

# Production deployment
./deploy-production.sh

# Manual commands
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d
```

## 🔍 **Verification Steps**

### **1. Check Container Status**
```bash
docker-compose ps
```
Should show all services as "Up" and "healthy"

### **2. Test Frontend**
```bash
curl http://localhost/
```
Should return HTML content

### **3. Test Backend API**
```bash
curl http://localhost/api/health
```
Should return health status

### **4. Check Logs**
```bash
docker-compose logs -f
```
Should show no errors

## 🛠️ **Troubleshooting**

### **Common Issues:**

#### **1. Port Already in Use**
```bash
# Find process using port 80
netstat -ano | findstr :80

# Kill process (Windows)
taskkill /PID <PID> /F

# Kill process (Linux/Mac)
sudo kill -9 <PID>
```

#### **2. Permission Issues**
```bash
# Fix permissions (Linux/Mac)
sudo chown -R $USER:$USER downloads cache temp logs
chmod -R 755 downloads cache temp logs
```

#### **3. Docker Build Fails**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

#### **4. Services Not Starting**
```bash
# Check logs
docker-compose logs backend
docker-compose logs frontend
docker-compose logs nginx

# Check environment
docker-compose config
```

## 📊 **Performance Monitoring**

### **Resource Usage**
```bash
# Check container stats
docker stats

# Check disk usage
docker system df

# Check logs size
du -sh logs/
```

### **Health Checks**
```bash
# Backend health
curl http://localhost/api/health

# Frontend health
curl http://localhost/

# Nginx health
docker-compose exec nginx nginx -t
```

## 🔒 **Security Considerations**

### **Production Security:**
1. **SSL Certificates**: Place in `nginx/ssl/`
2. **Environment Variables**: Use secure values in `.env`
3. **Firewall**: Only expose ports 80 and 443
4. **Updates**: Regularly update Docker images
5. **Backups**: Regular database and file backups

### **SSL Setup:**
```bash
# Let's Encrypt (Linux/Mac)
certbot certonly --standalone -d yourdomain.com
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

## 📈 **Scaling and Optimization**

### **Resource Limits:**
- **Backend**: 1.5 CPU, 2GB RAM
- **Frontend**: 0.5 CPU, 512MB RAM
- **Nginx**: 0.5 CPU, 512MB RAM
- **PostgreSQL**: 1 CPU, 1GB RAM

### **Scaling Commands:**
```bash
# Scale backend
docker-compose up -d --scale backend=2

# Update resource limits in docker-compose.yml
# Then restart
docker-compose up -d
```

## 🎉 **Success Indicators**

Your deployment is successful when:
- ✅ All containers show "Up" status
- ✅ Health checks pass
- ✅ Frontend loads at http://localhost
- ✅ API responds at http://localhost/api/health
- ✅ No errors in logs
- ✅ Performance scores 95+ on PageSpeed Insights

## 📞 **Support**

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment: `docker-compose config`
3. Check resources: `docker stats`
4. Review this guide for troubleshooting steps

Your YouTube to MP3 Converter is now ready for deployment! 🚀
