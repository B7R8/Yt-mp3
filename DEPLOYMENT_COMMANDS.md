# 🚀 YouTube to MP3 Converter - Deployment Commands

## 📋 **Quick Reference Commands**

### **Windows (PowerShell)**
```powershell
# Quick deployment
.\deploy.ps1 -Quick

# Full deployment
.\deploy.ps1

# Production deployment
.\deploy.ps1 -Production

# Help
.\deploy.ps1 -Help
```

### **Windows (CMD/Batch)**
```cmd
# Quick deployment
deploy.bat

# Manual commands
docker-compose down --remove-orphans
docker-compose up -d --build
```

### **Linux/Mac (Bash)**
```bash
# Quick deployment
./deploy-quick.sh

# Full deployment
./deploy.sh

# Production deployment
./deploy-production.sh
```

## 🔧 **Manual Docker Commands**

### **Basic Deployment**
```bash
# Stop existing containers
docker-compose down --remove-orphans

# Build and start
docker-compose up -d --build

# Check status
docker-compose ps

# View logs
docker-compose logs -f
```

### **Production Deployment**
```bash
# Build without cache
docker-compose build --no-cache

# Start with production settings
docker-compose up -d

# Check health
docker-compose exec backend wget --no-verbose --tries=1 --spider http://localhost:3001/api/health
docker-compose exec frontend wget --no-verbose --tries=1 --spider http://localhost/
```

### **Maintenance Commands**
```bash
# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update services
docker-compose pull
docker-compose up -d --build

# View resource usage
docker stats

# Clean up
docker system prune -a
```

## 📁 **Updated Files Summary**

### **Docker Files** ✅
- `frontend/Dockerfile` - Updated with Tailwind CSS and performance optimizations
- `backend/Dockerfile` - Multi-stage build with FFmpeg and yt-dlp
- `docker-compose.yml` - Updated to use optimized Nginx configuration

### **Deployment Scripts** ✅
- `deploy.sh` - Full deployment script (Linux/Mac)
- `deploy-production.sh` - Production deployment script (Linux/Mac)
- `deploy-quick.sh` - Quick deployment script (Linux/Mac)
- `deploy.ps1` - PowerShell deployment script (Windows)
- `deploy.bat` - Batch deployment script (Windows)

### **Configuration Files** ✅
- `nginx/nginx-optimized.conf` - Optimized Nginx configuration
- `frontend/tailwind.config.js` - Fixed Tailwind configuration
- `frontend/postcss.config.js` - Fixed PostCSS configuration

## 🎯 **Deployment Options**

### **1. Quick Development** ⚡
```bash
# Windows
.\deploy.ps1 -Quick
# or
deploy.bat

# Linux/Mac
./deploy-quick.sh
```
- Fastest deployment
- Good for testing
- No SSL required

### **2. Full Development** 🔧
```bash
# Windows
.\deploy.ps1

# Linux/Mac
./deploy.sh
```
- Complete setup
- Environment checks
- Health monitoring

### **3. Production** 🚀
```bash
# Windows
.\deploy.ps1 -Production

# Linux/Mac
./deploy-production.sh
```
- SSL support
- Security optimizations
- Resource monitoring
- Log rotation

## 🔍 **Verification Commands**

### **Check Status**
```bash
# Container status
docker-compose ps

# Resource usage
docker stats

# Health checks
curl http://localhost/api/health
curl http://localhost/
```

### **View Logs**
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx
```

### **Test Endpoints**
```bash
# Frontend
curl http://localhost/

# Backend API
curl http://localhost/api/health
curl http://localhost/api/process/health

# With HTTPS (production)
curl https://yourdomain.com/
curl https://yourdomain.com/api/health
```

## 🛠️ **Troubleshooting Commands**

### **Common Issues**
```bash
# Port conflicts
netstat -ano | findstr :80
netstat -ano | findstr :443

# Permission issues (Linux/Mac)
sudo chown -R $USER:$USER downloads cache temp logs
chmod -R 755 downloads cache temp logs

# Docker issues
docker system prune -a
docker-compose build --no-cache
```

### **Debug Commands**
```bash
# Check configuration
docker-compose config

# Check environment
docker-compose exec backend env
docker-compose exec frontend env

# Check file permissions
docker-compose exec backend ls -la /app
docker-compose exec frontend ls -la /usr/share/nginx/html
```

## 📊 **Performance Monitoring**

### **Resource Monitoring**
```bash
# Container stats
docker stats --no-stream

# Disk usage
docker system df

# Log sizes
du -sh logs/
```

### **Health Monitoring**
```bash
# Backend health
docker-compose exec backend wget --no-verbose --tries=1 --spider http://localhost:3001/api/health

# Frontend health
docker-compose exec frontend wget --no-verbose --tries=1 --spider http://localhost/

# Nginx health
docker-compose exec nginx nginx -t
```

## 🎉 **Success Indicators**

Your deployment is successful when:
- ✅ All containers show "Up" status
- ✅ Health checks return 200 OK
- ✅ Frontend loads without errors
- ✅ API responds correctly
- ✅ No errors in logs
- ✅ Performance scores 95+ on PageSpeed Insights

## 🚀 **Ready to Deploy!**

Choose your deployment method:

1. **Quick Start**: Use `deploy.bat` (Windows) or `./deploy-quick.sh` (Linux/Mac)
2. **Full Setup**: Use `.\deploy.ps1` (Windows) or `./deploy.sh` (Linux/Mac)
3. **Production**: Use `.\deploy.ps1 -Production` (Windows) or `./deploy-production.sh` (Linux/Mac)

Your YouTube to MP3 Converter is now ready for deployment! 🎨✨
