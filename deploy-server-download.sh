#!/bin/bash

echo "🚀 Deploying YouTube MP3 Converter with Server-Side Download Fix"
echo "================================================================"

# Stop current containers
echo "📦 Stopping current containers..."
docker-compose down

# Make download script executable
echo "🔧 Making download script executable..."
chmod +x backend/scripts/downloadFromApi.js

# Create downloads directory on server
echo "📁 Creating downloads directory..."
mkdir -p /var/Yt-mp3/downloads
chmod 755 /var/Yt-mp3/downloads

# Build and start containers
echo "🔨 Building and starting containers..."
docker-compose up -d --build

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Show logs
echo "📋 Recent logs:"
docker-compose logs --tail=20 backend

echo ""
echo "✅ Deployment complete!"
echo "🎯 Files will now be downloaded to: /var/Yt-mp3/downloads"
echo "🌐 Test your conversion at: http://your-domain.com"
echo ""
echo "📊 To monitor logs: docker-compose logs -f backend"
