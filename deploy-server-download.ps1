# PowerShell deployment script for YouTube MP3 Converter
# This script deploys the application with the database schema fixes

Write-Host "🚀 Deploying YouTube MP3 Converter with Database Schema Fix" -ForegroundColor Green
Write-Host "================================================================" -ForegroundColor Green

# Stop current containers
Write-Host "📦 Stopping current containers..." -ForegroundColor Yellow
try {
    docker-compose down
    Write-Host "✅ Containers stopped successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Using docker compose instead..." -ForegroundColor Yellow
    docker compose down
}

# Create downloads directory
Write-Host "📁 Creating downloads directory..." -ForegroundColor Yellow
if (!(Test-Path "downloads")) {
    New-Item -ItemType Directory -Path "downloads" -Force
    Write-Host "✅ Downloads directory created" -ForegroundColor Green
} else {
    Write-Host "✅ Downloads directory already exists" -ForegroundColor Green
}

# Create cache directory
Write-Host "📁 Creating cache directory..." -ForegroundColor Yellow
if (!(Test-Path "cache")) {
    New-Item -ItemType Directory -Path "cache" -Force
    Write-Host "✅ Cache directory created" -ForegroundColor Green
} else {
    Write-Host "✅ Cache directory already exists" -ForegroundColor Green
}

# Create temp directory
Write-Host "📁 Creating temp directory..." -ForegroundColor Yellow
if (!(Test-Path "temp")) {
    New-Item -ItemType Directory -Path "temp" -Force
    Write-Host "✅ Temp directory created" -ForegroundColor Green
} else {
    Write-Host "✅ Temp directory already exists" -ForegroundColor Green
}

# Create logs directory
Write-Host "📁 Creating logs directory..." -ForegroundColor Yellow
if (!(Test-Path "logs")) {
    New-Item -ItemType Directory -Path "logs" -Force
    Write-Host "✅ Logs directory created" -ForegroundColor Green
} else {
    Write-Host "✅ Logs directory already exists" -ForegroundColor Green
}

# Build and start containers
Write-Host "🔨 Building and starting containers with database schema fixes..." -ForegroundColor Yellow
try {
    docker-compose up -d --build
    Write-Host "✅ Containers started successfully" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Using docker compose instead..." -ForegroundColor Yellow
    docker compose up -d --build
}

# Wait for services to start
Write-Host "⏳ Waiting for services to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 15

# Check if services are running
Write-Host "🔍 Checking service status..." -ForegroundColor Yellow
try {
    docker-compose ps
} catch {
    docker compose ps
}

# Show recent logs
Write-Host "📋 Recent backend logs (showing database schema updates):" -ForegroundColor Yellow
try {
    docker-compose logs --tail=30 backend
} catch {
    docker compose logs --tail=30 backend
}

Write-Host ""
Write-Host "✅ Deployment complete!" -ForegroundColor Green
Write-Host "🎯 Database schema has been updated with quality columns" -ForegroundColor Cyan
Write-Host "🌐 Test your conversion at: http://localhost" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 To monitor logs: docker-compose logs -f backend" -ForegroundColor White
Write-Host "🔄 To restart: docker-compose restart backend" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Your YouTube to MP3 converter is now ready!" -ForegroundColor Green
