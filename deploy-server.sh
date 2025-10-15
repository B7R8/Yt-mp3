#!/bin/bash

# ===========================================
# YouTube-to-MP3 Converter - Server Deployment Script
# ===========================================

set -e

echo "🚀 Starting YouTube-to-MP3 Converter Server Deployment..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    print_error "Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    print_error "Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    print_error ".env file not found. Please create it first."
    exit 1
fi

print_status "Checking system requirements..."

# Check available disk space (minimum 5GB)
AVAILABLE_SPACE=$(df . | tail -1 | awk '{print $4}')
if [ "$AVAILABLE_SPACE" -lt 5242880 ]; then
    print_warning "Low disk space detected. At least 5GB is recommended."
fi

# Check available memory (minimum 2GB)
TOTAL_MEMORY=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ "$TOTAL_MEMORY" -lt 2048 ]; then
    print_warning "Low memory detected. At least 2GB RAM is recommended."
fi

print_status "Creating necessary directories..."
mkdir -p downloads cache temp logs nginx/ssl

print_status "Setting up file permissions..."
chmod 755 downloads cache temp logs
chmod 600 nginx/ssl/* 2>/dev/null || true

print_status "Building and starting services..."
docker-compose down --remove-orphans
docker-compose build --no-cache
docker-compose up -d

print_status "Waiting for services to start..."
sleep 30

# Health checks
print_status "Performing health checks..."

# Check PostgreSQL
if docker-compose exec -T postgres pg_isready -U postgres -d youtube_converter > /dev/null 2>&1; then
    print_success "PostgreSQL is healthy"
else
    print_error "PostgreSQL health check failed"
    docker-compose logs postgres
    exit 1
fi

# Check Redis
if docker-compose exec -T redis redis-cli ping > /dev/null 2>&1; then
    print_success "Redis is healthy"
else
    print_error "Redis health check failed"
    docker-compose logs redis
    exit 1
fi

# Check Backend
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "Backend API is healthy"
else
    print_error "Backend API health check failed"
    docker-compose logs backend
    exit 1
fi

# Check Frontend
if curl -f http://localhost:3000 > /dev/null 2>&1; then
    print_success "Frontend is healthy"
else
    print_error "Frontend health check failed"
    docker-compose logs frontend
    exit 1
fi

# Check Nginx
if curl -f http://localhost > /dev/null 2>&1; then
    print_success "Nginx is healthy"
else
    print_error "Nginx health check failed"
    docker-compose logs nginx
    exit 1
fi

print_success "🎉 Deployment completed successfully!"
echo ""
echo "📋 Service URLs:"
echo "   Frontend: https://saveytb.com"
echo "   Backend API: https://saveytb.com/api"
echo "   Grafana: http://31.97.149.135:3002"
echo "   Nginx: https://saveytb.com"
echo ""
echo "🔧 Management Commands:"
echo "   View logs: docker-compose logs -f [service]"
echo "   Stop services: docker-compose down"
echo "   Restart services: docker-compose restart"
echo "   Update services: docker-compose pull && docker-compose up -d"
echo ""
echo "📊 Monitoring:"
echo "   Grafana: http://31.97.149.135:3002 (admin/admin)"
echo "   Health check: https://saveytb.com/api/health"
echo ""
print_warning "Remember to:"
echo "   1. Change default passwords in .env"
echo "   2. Set up SSL certificates for production"
echo "   3. Configure firewall rules"
echo "   4. Set up regular backups"
echo ""
print_success "Your YouTube-to-MP3 Converter is now running! 🎵"
