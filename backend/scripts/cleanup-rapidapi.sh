#!/bin/bash

# Cleanup script for RapidAPI-only conversion
# This script removes old ffmpeg/yt-dlp related files and directories

echo "🧹 Starting cleanup for RapidAPI-only conversion..."

# Remove old conversion services
echo "📁 Removing old conversion services..."
rm -f src/services/conversionService.ts
rm -f src/services/fallbackConversionService.ts

# Remove old migration files
echo "📁 Removing old migration files..."
rm -f migrations/001_create_jobs_table.sql
rm -f migrations/002_add_processed_path_column.sql
rm -f migrations/003_add_quality_columns.sql

# Clean up old database files
echo "📁 Cleaning up old database files..."
rm -f conversions.db
rm -f conversions.db-shm
rm -f conversions.db-wal

# Remove old scripts
echo "📁 Removing old scripts..."
rm -f run-database-fix.sh
rm -f run-emergency-fix.sh
rm -f run-migration.sh
rm -f run-quality-migration.ps1
rm -f run-quality-migration.sh
rm -f fix-database.sh
rm -f emergency-fix.sql
rm -f fix-database-now.sql
rm -f fix-database-schema.js
rm -f fix-database-schema.sql
rm -f fix-quality-columns.sql
rm -f add-processed-path-column.sql

# Clean up temp directories
echo "📁 Cleaning up temp directories..."
rm -rf temp/*
rm -rf downloads/*
rm -rf cache/*

# Remove old test files
echo "📁 Removing old test files..."
rm -f test/processAudio.test.ts

echo "✅ Cleanup completed successfully!"
echo "🚀 The project is now configured for RapidAPI-only conversion"
