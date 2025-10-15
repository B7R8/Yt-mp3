# 🚀 SaveYTB.com - Server Deployment Guide

## 📋 Server Information
- **Server IP**: 31.97.149.135
- **Domain**: saveytb.com
- **Protocol**: HTTPS
- **Email**: contact@saveytb.com

## 🔧 Quick Deployment

### 1. Upload Files to Server
```bash
# Upload the entire Yt-mp3 folder to your server
scp -r Yt-mp3/ root@31.97.149.135:/root/
```

### 2. Connect to Server
```bash
ssh root@31.97.149.135
cd /root/Yt-mp3
```

### 3. Install Docker (if not installed)
```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh
systemctl enable docker
systemctl start docker

# Install Docker Compose
curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 4. Deploy Application
```bash
# Make deployment script executable
chmod +x deploy-server.sh

# Run deployment
./deploy-server.sh
```

## 🔐 SSL Certificate Setup

### Option 1: Let's Encrypt (Recommended)
```bash
# Install Certbot
apt update
apt install certbot

# Get SSL certificate
certbot certonly --standalone -d saveytb.com -d www.saveytb.com

# Copy certificates to nginx directory
cp /etc/letsencrypt/live/saveytb.com/fullchain.pem nginx/ssl/
cp /etc/letsencrypt/live/saveytb.com/privkey.pem nginx/ssl/

# Set permissions
chmod 600 nginx/ssl/*
```

### Option 2: Manual SSL Certificates
```bash
# Create SSL directory
mkdir -p nginx/ssl

# Upload your SSL certificates
# fullchain.pem -> nginx/ssl/fullchain.pem
# privkey.pem -> nginx/ssl/privkey.pem

# Set permissions
chmod 600 nginx/ssl/*
```

## 🔧 Configuration

### Environment Variables (env.production)
All configuration is already set up in `env.production`:

- ✅ **Domain**: saveytb.com
- ✅ **Database**: youtube_converter
- ✅ **Email**: contact@saveytb.com
- ✅ **Crypto Wallets**: All configured
- ✅ **Redis**: Configured
- ✅ **Grafana**: Configured

### Important: Change These Passwords
```bash
# Edit env.production
nano env.production

# Change these values:
DB_PASSWORD=your_secure_database_password
JWT_SECRET=your_jwt_secret_key
SESSION_SECRET=your_session_secret_key
GRAFANA_ADMIN_PASSWORD=your_grafana_password
SMTP_PASS=your_email_password
```

## 🌐 DNS Configuration

Make sure your DNS is pointing to the server:
```
A    saveytb.com        -> 31.97.149.135
A    www.saveytb.com    -> 31.97.149.135
```

## 🔥 Firewall Configuration

```bash
# Allow HTTP/HTTPS
ufw allow 80
ufw allow 443

# Allow SSH (if needed)
ufw allow 22

# Allow Grafana (optional)
ufw allow 3002

# Enable firewall
ufw enable
```

## 📊 Service URLs

After deployment, your services will be available at:

- **Main Website**: https://saveytb.com
- **API**: https://saveytb.com/api
- **Grafana**: http://31.97.149.135:3002 (admin/admin)
- **Health Check**: https://saveytb.com/api/health

## 🔄 Management Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f nginx

# Restart services
docker-compose restart

# Stop services
docker-compose down

# Update and restart
docker-compose pull
docker-compose up -d
```

## 🗄️ Database Management

```bash
# Create database backup
docker-compose exec postgres pg_dump -U postgres youtube_converter > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore database backup
docker-compose exec -T postgres psql -U postgres youtube_converter < backup_file.sql
```

## 🔍 Troubleshooting

### Check Service Status
```bash
docker-compose ps
```

### Check Logs
```bash
docker-compose logs -f [service_name]
```

### Check SSL Certificate
```bash
curl -I https://saveytb.com
```

### Check Database Connection
```bash
docker-compose exec postgres psql -U postgres -d youtube_converter -c "SELECT 1;"
```

## 🚨 Common Issues

### 1. SSL Certificate Issues
```bash
# Check certificate files
ls -la nginx/ssl/

# Restart nginx
docker-compose restart nginx
```

### 2. Database Connection Issues
```bash
# Check database logs
docker-compose logs postgres

# Restart database
docker-compose restart postgres
```

### 3. Port Already in Use
```bash
# Check what's using the port
netstat -tulpn | grep :80
netstat -tulpn | grep :443

# Kill the process
kill -9 <PID>
```

## 📈 Performance Optimization

### 1. Increase Resources (if needed)
Edit `docker-compose.yml` and increase:
```yaml
deploy:
  resources:
    limits:
      cpus: '2'
      memory: 4G
```

### 2. Database Optimization
```bash
# Connect to database
docker-compose exec postgres psql -U postgres youtube_converter

# Run optimization
VACUUM ANALYZE;
```

## 🔄 Auto-Update SSL Certificates

```bash
# Create renewal script
cat > /root/renew-ssl.sh << 'EOF'
#!/bin/bash
certbot renew --quiet
cp /etc/letsencrypt/live/saveytb.com/fullchain.pem /root/Yt-mp3/nginx/ssl/
cp /etc/letsencrypt/live/saveytb.com/privkey.pem /root/Yt-mp3/nginx/ssl/
docker-compose restart nginx
EOF

chmod +x /root/renew-ssl.sh

# Add to crontab (run every 2 months)
echo "0 3 1 */2 * /root/renew-ssl.sh" | crontab -
```

## ✅ Final Checklist

- [ ] Files uploaded to server
- [ ] Docker and Docker Compose installed
- [ ] SSL certificates configured
- [ ] DNS pointing to server
- [ ] Firewall configured
- [ ] Passwords changed in env.production
- [ ] Services deployed and running
- [ ] Website accessible at https://saveytb.com
- [ ] API working at https://saveytb.com/api
- [ ] Grafana accessible at http://31.97.149.135:3002

## 🎉 Success!

Your YouTube-to-MP3 converter is now live at **https://saveytb.com**! 🎵

---

**Need help?** Check the logs: `docker-compose logs -f`
