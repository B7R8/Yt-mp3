# Cleanup script for RapidAPI-only conversion
# This script removes old ffmpeg/yt-dlp related files and directories

Write-Host "🧹 Starting cleanup for RapidAPI-only conversion..." -ForegroundColor Green

# Remove old conversion services
Write-Host "📁 Removing old conversion services..." -ForegroundColor Yellow
Remove-Item -Path "src/services/conversionService.ts" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "src/services/fallbackConversionService.ts" -Force -ErrorAction SilentlyContinue

# Remove old migration files
Write-Host "📁 Removing old migration files..." -ForegroundColor Yellow
Remove-Item -Path "migrations/001_create_jobs_table.sql" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "migrations/002_add_processed_path_column.sql" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "migrations/003_add_quality_columns.sql" -Force -ErrorAction SilentlyContinue

# Clean up old database files
Write-Host "📁 Cleaning up old database files..." -ForegroundColor Yellow
Remove-Item -Path "conversions.db" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "conversions.db-shm" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "conversions.db-wal" -Force -ErrorAction SilentlyContinue

# Remove old scripts
Write-Host "📁 Removing old scripts..." -ForegroundColor Yellow
Remove-Item -Path "run-database-fix.sh" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "run-emergency-fix.sh" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "run-migration.sh" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "run-quality-migration.ps1" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "run-quality-migration.sh" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "fix-database.sh" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "emergency-fix.sql" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "fix-database-now.sql" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "fix-database-schema.js" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "fix-database-schema.sql" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "fix-quality-columns.sql" -Force -ErrorAction SilentlyContinue
Remove-Item -Path "add-processed-path-column.sql" -Force -ErrorAction SilentlyContinue

# Clean up temp directories
Write-Host "📁 Cleaning up temp directories..." -ForegroundColor Yellow
if (Test-Path "temp") { Remove-Item -Path "temp/*" -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path "downloads") { Remove-Item -Path "downloads/*" -Recurse -Force -ErrorAction SilentlyContinue }
if (Test-Path "cache") { Remove-Item -Path "cache/*" -Recurse -Force -ErrorAction SilentlyContinue }

# Remove old test files
Write-Host "📁 Removing old test files..." -ForegroundColor Yellow
Remove-Item -Path "test/processAudio.test.ts" -Force -ErrorAction SilentlyContinue

Write-Host "✅ Cleanup completed successfully!" -ForegroundColor Green
Write-Host "🚀 The project is now configured for RapidAPI-only conversion" -ForegroundColor Cyan
