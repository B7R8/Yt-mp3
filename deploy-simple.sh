#!/bin/bash

# YouTube to MP3 Converter - Simple Deployment Script
# Only deployment: clean old containers/images and build new ones

set -e

echo "🚀 Simple Deployment Starting..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Stop and remove existing containers
print_status "Stopping and removing existing containers..."
docker-compose down --remove-orphans || true

# Remove old images (optional - uncomment if you want to remove all old images)
# print_status "Removing old images..."
# docker image prune -f || true

# Remove specific project images
print_status "Removing old project images..."
docker images | grep yt-mp3 | awk '{print $3}' | xargs -r docker rmi -f || true

# Build and start new containers
print_status "Building and starting new containers..."
docker-compose up -d --build

# Wait a moment for services to start
print_status "Waiting for services to start..."
sleep 10

# Check status
print_status "Checking deployment status..."
docker-compose ps

print_success "🎉 Simple deployment completed!"
echo ""
echo "Your application is running at:"
echo "  🌐 Frontend: http://localhost"
echo "  🔧 Backend: http://localhost/api"
echo ""
echo "Commands:"
echo "  📋 View logs: docker-compose logs -f"
echo "  🛑 Stop: docker-compose down"
echo "  📊 Status: docker-compose ps"
echo "  🔄 Restart: docker-compose restart"
