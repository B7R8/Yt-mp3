#!/bin/bash

echo "🔧 Fixing database schema issue..."

# Stop containers
echo "Stopping containers..."
docker-compose down

# Remove old database files
echo "Removing old database files..."
find . -name "*.db" -type f -delete
rm -rf backend/data/

# Start services
echo "Starting services..."
docker-compose up -d

# Wait for services to start
echo "Waiting for services to start..."
sleep 30

# Check status
echo "Checking container status..."
docker-compose ps

# Test backend
echo "Testing backend..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    echo "✅ Backend is healthy!"
else
    echo "❌ Backend still has issues"
    docker-compose logs backend | tail -10
fi

echo "🎉 Fix completed!"
