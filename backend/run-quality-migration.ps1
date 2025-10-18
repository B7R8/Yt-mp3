# PowerShell script to run the quality columns migration
# This adds the missing quality, trim_start, trim_duration, and file_size columns

Write-Host "🔄 Running quality columns migration..." -ForegroundColor Yellow

# Check if we're using PostgreSQL or SQLite
if (Test-Path "conversions.db") {
    Write-Host "📊 Detected SQLite database" -ForegroundColor Blue
    Write-Host "⚠️  SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN" -ForegroundColor Yellow
    Write-Host "📝 Please manually add the following columns to your conversions table:" -ForegroundColor Cyan
    Write-Host "   - quality VARCHAR(20) DEFAULT '192k'" -ForegroundColor White
    Write-Host "   - trim_start REAL" -ForegroundColor White
    Write-Host "   - trim_duration REAL" -ForegroundColor White
    Write-Host "   - file_size INTEGER" -ForegroundColor White
    Write-Host ""
    Write-Host "🔧 You can use SQLite browser or run these commands:" -ForegroundColor Green
    Write-Host "   sqlite3 conversions.db 'ALTER TABLE conversions ADD COLUMN quality VARCHAR(20) DEFAULT \"192k\";'" -ForegroundColor White
    Write-Host "   sqlite3 conversions.db 'ALTER TABLE conversions ADD COLUMN trim_start REAL;'" -ForegroundColor White
    Write-Host "   sqlite3 conversions.db 'ALTER TABLE conversions ADD COLUMN trim_duration REAL;'" -ForegroundColor White
    Write-Host "   sqlite3 conversions.db 'ALTER TABLE conversions ADD COLUMN file_size INTEGER;'" -ForegroundColor White
} else {
    Write-Host "🐘 Detected PostgreSQL database" -ForegroundColor Blue
    Write-Host "🚀 Running migration..." -ForegroundColor Green
    
    # Set environment variables if not already set
    $env:PGPASSWORD = if ($env:POSTGRES_PASSWORD) { $env:POSTGRES_PASSWORD } else { "ytmp3_password" }
    $env:PGHOST = if ($env:POSTGRES_HOST) { $env:POSTGRES_HOST } else { "localhost" }
    $env:PGPORT = if ($env:POSTGRES_PORT) { $env:POSTGRES_PORT } else { "5432" }
    $env:PGUSER = if ($env:POSTGRES_USER) { $env:POSTGRES_USER } else { "ytmp3_user" }
    $env:PGDATABASE = if ($env:POSTGRES_DB) { $env:POSTGRES_DB } else { "ytmp3" }
    
    # Run the migration
    try {
        psql -f migrations/003_add_quality_columns.sql
        Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
    } catch {
        Write-Host "❌ Migration failed!" -ForegroundColor Red
        Write-Host $_.Exception.Message -ForegroundColor Red
        exit 1
    }
}

Write-Host "🎉 Database schema update complete!" -ForegroundColor Green