@echo off
echo 🔧 Fixing database configuration issue...

echo Stopping containers...
docker-compose down

echo Removing old database files...
for /f "delims=" %%i in ('dir /b /s *.db 2^>nul') do del "%%i"
if exist backend\data rmdir /s /q backend\data

echo Copying environment configuration...
copy env.production .env

echo Rebuilding backend to use PostgreSQL...
docker-compose build --no-cache backend

echo Starting services...
docker-compose up -d

echo Waiting for services to start...
timeout /t 45 /nobreak >nul

echo Checking container status...
docker-compose ps

echo Testing backend...
curl -f http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy!
    echo Testing conversion...
    curl -X POST http://localhost:3001/api/convert -H "Content-Type: application/json" -d "{\"url\": \"https://www.youtube.com/watch?v=dQw4w9WgXcQ\"}"
) else (
    echo ❌ Backend still has issues
    echo Backend logs:
    docker-compose logs backend
)

echo 🎉 Fix completed!
pause
