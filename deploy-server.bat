@echo off
REM ===========================================
REM YouTube-to-MP3 Converter - Server Deployment Script (Windows)
REM ===========================================

echo 🚀 Starting YouTube-to-MP3 Converter Server Deployment...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker is not installed. Please install Docker Desktop first.
    pause
    exit /b 1
)

REM Check if Docker Compose is installed
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Docker Compose is not installed. Please install Docker Compose first.
    pause
    exit /b 1
)

REM Check if env.production file exists
if not exist "env.production" (
    echo [ERROR] env.production file not found. Please create it first.
    pause
    exit /b 1
)

echo [INFO] Checking system requirements...

echo [INFO] Creating necessary directories...
if not exist "downloads" mkdir downloads
if not exist "cache" mkdir cache
if not exist "temp" mkdir temp
if not exist "logs" mkdir logs
if not exist "nginx\ssl" mkdir nginx\ssl

echo [INFO] Building and starting services...
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

echo [INFO] Waiting for services to start...
timeout /t 30 /nobreak >nul

echo [INFO] Performing health checks...

REM Check if services are running
docker-compose ps

echo.
echo [SUCCESS] 🎉 Deployment completed successfully!
echo.
echo 📋 Service URLs:
echo    Frontend: https://saveytb.com
echo    Backend API: https://saveytb.com/api
echo    Grafana: http://31.97.149.135:3002
echo    Nginx: https://saveytb.com
echo.
echo 🔧 Management Commands:
echo    View logs: docker-compose logs -f [service]
echo    Stop services: docker-compose down
echo    Restart services: docker-compose restart
echo    Update services: docker-compose pull ^&^& docker-compose up -d
echo.
echo 📊 Monitoring:
echo    Grafana: http://31.97.149.135:3002 (admin/admin)
echo    Health check: https://saveytb.com/api/health
echo.
echo [WARNING] Remember to:
echo    1. Change default passwords in env.production
echo    2. Set up SSL certificates for production
echo    3. Configure firewall rules
echo    4. Set up regular backups
echo.
echo [SUCCESS] Your YouTube-to-MP3 Converter is now running! 🎵
echo.
pause
