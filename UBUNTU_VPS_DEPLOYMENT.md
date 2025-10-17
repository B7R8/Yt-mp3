# 🐧 YouTube to MP3 Converter - Ubuntu VPS Deployment Guide

## 🎯 **Quick Start Commands**

### **Full Deployment (Recommended)**
```bash
# Make script executable
chmod +x deploy-ubuntu-vps.sh

# Run full deployment
./deploy-ubuntu-vps.sh
```

### **Quick Deployment**
```bash
# Make script executable
chmod +x deploy-quick-ubuntu.sh

# Run quick deployment
./deploy-quick-ubuntu.sh
```

### **Manual Deployment**
```bash
# Stop existing containers
docker-compose down --remove-orphans

# Build and start
docker-compose up -d --build

# Check status
docker-compose ps
```

## 🔧 **What's Included in This Update**

### ✅ **Fixed Dockerfile Issues**
- Removed Windows batch file (`install-ytdlp.bat`)
- Fixed yt-dlp installation for Linux
- Optimized multi-stage build
- Added proper health checks

### ✅ **Performance Optimizations**
- Tailwind CSS properly configured
- PostCSS with Autoprefixer
- Optimized Vite build configuration
- Code splitting and lazy loading
- Image optimization
- Service Worker for caching

### ✅ **Updated Docker Configuration**
- Frontend Dockerfile with Tailwind CSS
- Backend Dockerfile with FFmpeg and yt-dlp
- Optimized Nginx configuration
- Proper resource limits

### ✅ **Deployment Scripts**
- `deploy-ubuntu-vps.sh` - Full deployment with setup
- `deploy-quick-ubuntu.sh` - Quick deployment
- Automatic Docker installation
- Firewall configuration
- SSL setup guidance

## 🚀 **Deployment Process**

### **1. Prerequisites**
- Ubuntu 18.04+ VPS
- Root or sudo access
- At least 2GB RAM
- At least 5GB disk space

### **2. Clone Repository**
```bash
git clone https://github.com/B7R8/Yt-mp3.git
cd Yt-mp3
```

### **3. Run Deployment**
```bash
# Full deployment (recommended)
chmod +x deploy-ubuntu-vps.sh
./deploy-ubuntu-vps.sh

# Or quick deployment
chmod +x deploy-quick-ubuntu.sh
./deploy-quick-ubuntu.sh
```

### **4. Configure Environment**
```bash
# Edit environment file
nano .env

# Key variables to set:
# - DB_PASSWORD=your_secure_password
# - RAPIDAPI_KEY=your_rapidapi_key
# - VITE_API_URL=https://yourdomain.com/api
```

## 🔍 **Verification**

### **Check Services**
```bash
# Container status
docker-compose ps

# View logs
docker-compose logs -f

# Test endpoints
curl http://localhost/api/health
curl http://localhost/
```

### **Check Resource Usage**
```bash
# Container stats
docker stats

# Disk usage
df -h

# Memory usage
free -h
```

## 🛠️ **Troubleshooting**

### **Common Issues**

#### **1. Docker Not Installed**
```bash
# The script will install Docker automatically
# Or install manually:
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER
```

#### **2. Port Already in Use**
```bash
# Find process using port 80
sudo netstat -tulpn | grep :80

# Kill process
sudo kill -9 <PID>
```

#### **3. Permission Issues**
```bash
# Fix permissions
sudo chown -R $USER:$USER downloads cache temp logs
chmod -R 755 downloads cache temp logs
```

#### **4. Build Fails**
```bash
# Clean Docker cache
docker system prune -a

# Rebuild without cache
docker-compose build --no-cache
```

## 🔒 **Security Setup**

### **Firewall Configuration**
```bash
# Allow SSH
sudo ufw allow ssh

# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Enable firewall
sudo ufw enable
```

### **SSL Certificates**
```bash
# Install Certbot
sudo apt install certbot

# Get certificate
sudo certbot certonly --standalone -d yourdomain.com

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# Restart nginx
docker-compose restart nginx
```

## 📊 **Monitoring**

### **Log Rotation**
```bash
# The script sets up automatic log rotation
# Manual log cleanup:
find logs/ -name "*.log" -mtime +7 -delete
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

## 🎉 **Success Indicators**

Your deployment is successful when:
- ✅ All containers show "Up" status
- ✅ Health checks return 200 OK
- ✅ Frontend loads without errors
- ✅ API responds correctly
- ✅ No errors in logs
- ✅ Performance scores 95+ on PageSpeed Insights

## 📞 **Support**

If you encounter issues:
1. Check the logs: `docker-compose logs -f`
2. Verify environment: `docker-compose config`
3. Check resources: `docker stats`
4. Review this guide for troubleshooting steps

## 🚀 **Ready to Deploy!**

Your YouTube to MP3 Converter is now ready for Ubuntu VPS deployment with all the latest updates and optimizations! 🎨✨
