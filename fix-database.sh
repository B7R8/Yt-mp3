#!/bin/bash

echo "🔧 Fixing YouTube Converter Database..."
echo "======================================"

# Stop containers
echo "📦 Stopping containers..."
docker-compose down

# Remove old database volume to start fresh
echo "🗑️ Removing old database volume..."
docker volume rm yt-mp3_postgres_data 2>/dev/null || echo "Volume doesn't exist, continuing..."

# Start only PostgreSQL first
echo "🐘 Starting PostgreSQL..."
docker-compose up -d postgres

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until docker-compose exec postgres pg_isready -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Create database if it doesn't exist
echo "📊 Creating database..."
docker-compose exec postgres psql -U postgres -c "CREATE DATABASE youtube_converter;" 2>/dev/null || echo "Database already exists"

# Run the init script
echo "🔄 Running database initialization..."
docker-compose exec postgres psql -U postgres -d youtube_converter -f /docker-entrypoint-initdb.d/init.sql

echo "✅ Database initialization complete!"

# Start all services
echo "🚀 Starting all services..."
docker-compose up -d

# Wait for backend to be ready
echo "⏳ Waiting for backend to be ready..."
sleep 10

# Check status
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "✅ Database fix complete!"
echo "🌐 Your application should now be running at: http://your-domain.com"
echo "📊 To monitor logs: docker-compose logs -f backend"
