# 🚀 3 Commands for Deployment

## 1. Build and Deploy
```bash
docker-compose build --no-cache
```

## 2. Start Services
```bash
docker-compose up -d
```

## 3. Verify Deployment
```bash
curl http://localhost/api/health
```

---

## 📋 Complete Deployment Process

### Step 1: Environment Setup
```bash
# Set your RapidAPI keys in .env file
RAPIDAPI_KEY=your_primary_key
RAPIDAPI_KEY2=your_backup_key_1
RAPIDAPI_KEY3=your_backup_key_2
RAPIDAPI_KEY4=your_backup_key_3
RAPIDAPI_KEY5=your_backup_key_4
```

### Step 2: Deploy
```bash
docker-compose build --no-cache
docker-compose up -d
```

### Step 3: Test
```bash
curl http://localhost/api/health
```

---

## 🎯 What's Updated

✅ **RapidAPI-only conversion** (no ffmpeg/yt-dlp)
✅ **Multi-key fallback system** (automatic key switching)
✅ **Direct download links** (no local file storage)
✅ **New database schema** (videos table)
✅ **Cleanup old files** (removed unused code)
✅ **Docker optimized** (lightweight images)

---

## 🔧 Quick Commands

```bash
# Check status
docker-compose ps

# View logs
docker-compose logs -f backend

# Stop services
docker-compose down

# Restart services
docker-compose restart
```

**Ready for production!** 🎉
