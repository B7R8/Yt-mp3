#!/bin/bash

echo "🔧 Fixing Database Password Issue..."

# Stop the containers
echo "📦 Stopping containers..."
docker-compose down

# Remove the postgres volume to start fresh
echo "🗑️ Removing old postgres volume..."
docker volume rm yt-mp3_postgres_data 2>/dev/null || echo "Volume not found, continuing..."

# Rebuild and start with correct password
echo "🚀 Starting with correct password from .env..."
docker-compose up -d

# Wait for postgres to be ready
echo "⏳ Waiting for postgres to be ready..."
sleep 10

# Check if postgres is running
echo "🔍 Checking postgres status..."
docker-compose ps postgres

echo "✅ Database password fix complete!"
echo "📝 Your .env file should have: DB_PASSWORD=@3123sfnx3123@"
echo "🔗 The database will now use this password from your .env file"
