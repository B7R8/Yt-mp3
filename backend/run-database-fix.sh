#!/bin/bash

# Database schema fix script
# This script adds missing columns to the conversions table

echo "🔧 Fixing database schema..."

# Run the SQL fix script
psql -h postgres -p 5432 -U postgres -d youtube_converter -f /app/fix-database-schema.sql

echo "✅ Database schema fixed!"
echo "🔄 Restarting backend service..."

# Restart the backend service
docker-compose restart backend

echo "✅ Backend service restarted!"
echo "🎉 Database fix completed!"
