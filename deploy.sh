#!/bin/bash

# YouTube to MP3 Converter - Deployment Script
# This script handles the complete deployment process

set -e  # Exit on any error

echo "🚀 Starting YouTube to MP3 Converter Deployment..."

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
check_docker() {
    print_status "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Please install Docker Compose first."
        exit 1
    fi
    
    print_success "Docker and Docker Compose are installed"
}

# Check if .env file exists
check_env() {
    print_status "Checking environment configuration..."
    if [ ! -f .env ]; then
        print_warning ".env file not found. Creating from template..."
        if [ -f env.template ]; then
            cp env.template .env
            print_success "Created .env file from template"
            print_warning "Please edit .env file with your configuration before continuing"
            read -p "Press Enter to continue after editing .env file..."
        else
            print_error "env.template not found. Please create .env file manually."
            exit 1
        fi
    else
        print_success "Environment file found"
    fi
}

# Create necessary directories
create_directories() {
    print_status "Creating necessary directories..."
    mkdir -p downloads cache temp logs nginx/ssl
    print_success "Directories created"
}

# Stop existing containers
stop_containers() {
    print_status "Stopping existing containers..."
    docker-compose down --remove-orphans || true
    print_success "Existing containers stopped"
}

# Build and start services
deploy_services() {
    print_status "Building and starting services..."
    
    # Build images
    print_status "Building Docker images..."
    docker-compose build --no-cache
    
    # Start services
    print_status "Starting services..."
    docker-compose up -d
    
    print_success "Services started successfully"
}

# Wait for services to be healthy
wait_for_services() {
    print_status "Waiting for services to be healthy..."
    
    # Wait for backend
    print_status "Waiting for backend to be ready..."
    timeout 60 bash -c 'until docker-compose exec backend wget --no-verbose --tries=1 --spider http://localhost:3001/api/health; do sleep 2; done' || {
        print_error "Backend failed to start within 60 seconds"
        docker-compose logs backend
        exit 1
    }
    
    # Wait for frontend
    print_status "Waiting for frontend to be ready..."
    timeout 30 bash -c 'until docker-compose exec frontend wget --no-verbose --tries=1 --spider http://localhost/; do sleep 2; done' || {
        print_error "Frontend failed to start within 30 seconds"
        docker-compose logs frontend
        exit 1
    }
    
    # Wait for nginx
    print_status "Waiting for nginx to be ready..."
    timeout 30 bash -c 'until docker-compose exec nginx nginx -t; do sleep 2; done' || {
        print_error "Nginx failed to start within 30 seconds"
        docker-compose logs nginx
        exit 1
    }
    
    print_success "All services are healthy"
}

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    docker-compose ps
    echo ""
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "Your application is now running at:"
    echo "  🌐 Frontend: http://localhost"
    echo "  🔧 Backend API: http://localhost/api"
    echo "  📊 Health Check: http://localhost/api/health"
    echo ""
    print_status "Useful commands:"
    echo "  📋 View logs: docker-compose logs -f"
    echo "  🔄 Restart: docker-compose restart"
    echo "  🛑 Stop: docker-compose down"
    echo "  📊 Status: docker-compose ps"
}

# Main deployment function
main() {
    echo "=========================================="
    echo "🚀 YouTube to MP3 Converter Deployment"
    echo "=========================================="
    echo ""
    
    check_docker
    check_env
    create_directories
    stop_containers
    deploy_services
    wait_for_services
    show_status
}

# Run main function
main "$@"