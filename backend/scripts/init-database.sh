#!/bin/bash

echo "🔧 Initializing YouTube Converter Database..."

# Wait for PostgreSQL to be ready
echo "⏳ Waiting for PostgreSQL to be ready..."
until pg_isready -h postgres -p 5432 -U postgres; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 2
done

echo "✅ PostgreSQL is ready!"

# Create database if it doesn't exist
echo "📊 Creating database if it doesn't exist..."
psql -h postgres -p 5432 -U postgres -c "CREATE DATABASE youtube_converter;" 2>/dev/null || echo "Database already exists"

# Run migrations
echo "🔄 Running database migrations..."
cd /app
npm run migrate

echo "✅ Database initialization complete!"
