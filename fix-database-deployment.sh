#!/bin/bash

# Fix database deployment script for RapidAPI-only system
echo "🔧 Fixing database deployment for RapidAPI-only system"

# Stop existing containers
echo "📦 Stopping existing containers..."
docker-compose down

# Remove old database volume to start fresh
echo "🗑️ Removing old database volume..."
docker volume rm yt-mp3_postgres_data 2>/dev/null || true

# Build and start services
echo "🚀 Building and starting services..."
docker-compose build --no-cache
docker-compose up -d

# Wait for database to be ready
echo "⏳ Waiting for database to be ready..."
sleep 10

# Check if database is accessible
echo "🔍 Checking database connection..."
docker-compose exec postgres psql -U postgres -d youtube_converter -c "SELECT 1;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo "✅ Database is ready!"
else
    echo "❌ Database connection failed. Retrying..."
    sleep 5
    docker-compose exec postgres psql -U postgres -d youtube_converter -c "SELECT 1;"
fi

# Test the API
echo "🧪 Testing API health..."
sleep 5
curl -f http://localhost/api/health

if [ $? -eq 0 ]; then
    echo "✅ API is healthy!"
    echo "🎉 Deployment successful!"
else
    echo "❌ API health check failed"
    echo "📋 Check logs with: docker-compose logs backend"
fi

echo "📊 Container status:"
docker-compose ps
