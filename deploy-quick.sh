#!/bin/bash

# YouTube to MP3 Converter - Quick Deployment Script
# For development and testing

set -e

echo "🚀 Quick Deployment Starting..."

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

# Quick deployment
print_status "Stopping existing containers..."
docker-compose down --remove-orphans || true

print_status "Building and starting services..."
docker-compose up -d --build

print_status "Waiting for services..."
sleep 10

print_success "🎉 Quick deployment completed!"
echo ""
echo "Your application is running at:"
echo "  🌐 Frontend: http://localhost"
echo "  🔧 Backend: http://localhost/api"
echo ""
echo "Commands:"
echo "  📋 Logs: docker-compose logs -f"
echo "  🛑 Stop: docker-compose down"
echo "  📊 Status: docker-compose ps"
