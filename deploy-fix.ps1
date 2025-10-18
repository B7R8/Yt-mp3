# Quick deployment fix for PostgreSQL datetime function error
Write-Host "🔧 Fixing PostgreSQL datetime function error..." -ForegroundColor Cyan

# Build the updated backend
Write-Host "📦 Building updated backend..." -ForegroundColor Yellow
Set-Location backend
npm run build
Set-Location ..

# Deploy the fix
Write-Host "🚀 Deploying fix..." -ForegroundColor Green
docker-compose up -d --build backend

# Wait for restart
Write-Host "⏳ Waiting for backend to restart..." -ForegroundColor Yellow
Start-Sleep -Seconds 10

# Test the fix
Write-Host "🧪 Testing the fix..." -ForegroundColor Blue
try {
    $response = Invoke-RestMethod -Uri "http://localhost/api/convert" -Method Post -ContentType "application/json" -Body '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ"}'
    Write-Host "✅ Conversion started successfully!" -ForegroundColor Green
    Write-Host "Job ID: $($response.id)" -ForegroundColor Green
} catch {
    Write-Host "❌ Test failed: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "✅ Fix deployed! Check the logs with: docker-compose logs -f backend" -ForegroundColor Green
