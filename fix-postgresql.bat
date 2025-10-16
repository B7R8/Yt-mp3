@echo off
echo 🔧 Fixing PostgreSQL database configuration...

echo Step 1: Stopping all containers...
docker-compose down

echo Step 2: Ensuring .env file exists...
if not exist .env copy env.production .env

echo Step 3: Starting PostgreSQL first...
docker-compose up -d postgres

echo Step 4: Waiting for PostgreSQL to be ready...
timeout /t 20 /nobreak >nul

echo Step 5: Creating database and user...
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE youtube_converter;" 2>nul
docker-compose exec -T postgres psql -U postgres -c "CREATE USER ytmp3_user WITH PASSWORD 'ytmp3_password';" 2>nul

echo Step 6: Initializing database schema...
docker-compose exec -T postgres psql -U postgres -d youtube_converter -f /docker-entrypoint-initdb.d/init.sql

echo Step 7: Adding missing column...
docker-compose exec -T postgres psql -U postgres -d youtube_converter -c "ALTER TABLE conversions ADD COLUMN IF NOT EXISTS direct_download_url TEXT;"

echo Step 8: Setting permissions...
docker-compose exec -T postgres psql -U postgres -d youtube_converter -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ytmp3_user;" 2>nul
docker-compose exec -T postgres psql -U postgres -d youtube_converter -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ytmp3_user;" 2>nul

echo Step 9: Rebuilding backend...
docker-compose build --no-cache backend

echo Step 10: Starting all services...
docker-compose up -d

echo Step 11: Waiting for services to start...
timeout /t 30 /nobreak >nul

echo Step 12: Testing backend...
curl -f http://localhost:3001/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend is healthy and using PostgreSQL!
) else (
    echo ❌ Backend still has issues
    echo Checking logs...
    docker-compose logs backend | tail -10
)

echo 🎉 PostgreSQL configuration fix completed!
pause
