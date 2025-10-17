#!/bin/bash

# YouTube MP3 Converter with Audio Processing - Deployment Script
# This script helps deploy the complete system with audio processing capabilities

set -e

echo "🚀 Starting YouTube MP3 Converter with Audio Processing deployment..."

# Check if Docker and Docker Compose are installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  .env file not found. Creating from template..."
    if [ -f .env.example ]; then
        cp env.template .env
        echo "✅ Created .env file from .env.example"
        echo "📝 Please edit .env file with your configuration before continuing."
        echo "   Especially update:"
        echo "   - RAPIDAPI_KEY=your_actual_rapidapi_key"
        echo "   - CORS_ORIGIN=your_domain"
        echo "   - VITE_API_URL=your_api_url"
        read -p "Press Enter to continue after editing .env file..."
    else
        echo "❌ .env.example file not found. Please create .env file manually."
        exit 1
    fi
fi

# Create necessary directories
echo "📁 Creating necessary directories..."
mkdir -p downloads cache temp logs

# Set proper permissions
echo "🔐 Setting directory permissions..."
chmod 755 downloads cache temp logs

# Build and start services
echo "🔨 Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Check service health
echo "🏥 Checking service health..."
if docker-compose ps | grep -q "healthy"; then
    echo "✅ Services are healthy!"
else
    echo "⚠️  Some services may not be fully healthy yet. Check with: docker-compose ps"
fi

# Run database migrations
echo "🗄️  Running database migrations..."
docker-compose exec backend npm run migrate || echo "⚠️  Migration failed or already applied"

# Display service status
echo "📊 Service Status:"
docker-compose ps

echo ""
echo "🎉 Deployment completed!"
echo ""
echo "📋 Service URLs:"
echo "   - Frontend: http://localhost (or your domain)"
echo "   - Backend API: http://localhost:3001/api"
echo "   - Health Check: http://localhost:3001/api/health"
echo "   - Audio Processing: http://localhost:3001/api/process/health"
echo ""
echo "🔧 Useful Commands:"
echo "   - View logs: docker-compose logs -f"
echo "   - Stop services: docker-compose down"
echo "   - Restart services: docker-compose restart"
echo "   - Update services: docker-compose pull && docker-compose up -d"
echo ""
echo "📖 API Documentation:"
echo "   - Process Audio: POST /api/process"
echo "   - Download File: GET /api/download/:token"
echo "   - Job Status: GET /api/job/:jobId"
echo ""
echo "🎵 Supported Audio Processing:"
echo "   - Trim audio (start time + duration)"
echo "   - Quality adjustment (64K, 128K, 192K, 256K, 320K)"
echo "   - Audio re-encoding"
echo "   - Automatic cleanup after 20 minutes"
echo ""
echo "✨ Your YouTube MP3 Converter with Audio Processing is ready!"
