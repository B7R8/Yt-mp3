# Fix database deployment script for RapidAPI-only system
Write-Host "🔧 Fixing database deployment for RapidAPI-only system" -ForegroundColor Cyan

# Stop existing containers
Write-Host "📦 Stopping existing containers..." -ForegroundColor Yellow
docker-compose down

# Remove old database volume to start fresh
Write-Host "🗑️ Removing old database volume..." -ForegroundColor Yellow
docker volume rm yt-mp3_postgres_data 2>$null

# Build and start services
Write-Host "🚀 Building and starting services..." -ForegroundColor Green
docker-compose build --no-cache
docker-compose up -d

# Wait for database to be ready
Write-Host "⏳ Waiting for database to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Check if database is accessible
Write-Host "🔍 Checking database connection..." -ForegroundColor Blue
try {
    docker-compose exec postgres psql -U postgres -d youtube_converter -c "SELECT 1;" 2>$null
    Write-Host "✅ Database is ready!" -ForegroundColor Green
} catch {
    Write-Host "❌ Database connection failed. Retrying..." -ForegroundColor Red
    Start-Sleep -Seconds 5
    docker-compose exec postgres psql -U postgres -d youtube_converter -c "SELECT 1;"
}

# Test the API
Write-Host "🧪 Testing API health..." -ForegroundColor Blue
Start-Sleep -Seconds 5
try {
    $response = Invoke-RestMethod -Uri "http://localhost/api/health" -Method Get
    Write-Host "✅ API is healthy!" -ForegroundColor Green
    Write-Host "🎉 Deployment successful!" -ForegroundColor Green
} catch {
    Write-Host "❌ API health check failed" -ForegroundColor Red
    Write-Host "📋 Check logs with: docker-compose logs backend" -ForegroundColor Yellow
}

Write-Host "📊 Container status:" -ForegroundColor Cyan
docker-compose ps
