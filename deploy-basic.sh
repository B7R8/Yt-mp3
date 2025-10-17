#!/bin/bash

# YouTube to MP3 Converter - Basic Deployment
# Minimal deployment script

echo "🚀 Basic Deployment Starting..."

# Stop existing containers
echo "Stopping existing containers..."
docker-compose down --remove-orphans

# Build and start
echo "Building and starting..."
docker-compose up -d --build

# Wait
echo "Waiting for services..."
sleep 15

# Show status
echo "Deployment completed!"
docker-compose ps

echo ""
echo "Application running at:"
echo "  Frontend: http://localhost"
echo "  Backend: http://localhost/api"
echo ""
echo "Commands:"
echo "  Logs: docker-compose logs -f"
echo "  Stop: docker-compose down"
