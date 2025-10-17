#!/bin/bash

# YouTube to MP3 Converter - Production Deployment Script
# This script handles production deployment with SSL and optimizations

set -e  # Exit on any error

echo "🚀 Starting Production Deployment..."

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

# Check if running as root
check_root() {
    if [ "$EUID" -eq 0 ]; then
        print_warning "Running as root. This is not recommended for production."
        read -p "Continue anyway? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            exit 1
        fi
    fi
}

# Check system requirements
check_requirements() {
    print_status "Checking system requirements..."
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Check Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed"
        exit 1
    fi
    
    # Check available disk space (at least 5GB)
    available_space=$(df . | tail -1 | awk '{print $4}')
    if [ "$available_space" -lt 5242880 ]; then  # 5GB in KB
        print_error "Insufficient disk space. At least 5GB required."
        exit 1
    fi
    
    # Check available memory (at least 2GB)
    available_memory=$(free -m | awk 'NR==2{printf "%.0f", $7}')
    if [ "$available_memory" -lt 2048 ]; then
        print_warning "Low available memory. At least 2GB recommended."
    fi
    
    print_success "System requirements met"
}

# Setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if [ ! -d "nginx/ssl" ]; then
        mkdir -p nginx/ssl
    fi
    
    if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
        print_warning "SSL certificates not found in nginx/ssl/"
        print_status "Please place your SSL certificates:"
        echo "  - nginx/ssl/fullchain.pem (certificate chain)"
        echo "  - nginx/ssl/privkey.pem (private key)"
        echo ""
        print_status "For Let's Encrypt, you can use:"
        echo "  certbot certonly --standalone -d yourdomain.com"
        echo "  cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/"
        echo "  cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/"
        echo ""
        read -p "Press Enter after placing SSL certificates..."
    fi
    
    print_success "SSL certificates configured"
}

# Setup environment for production
setup_production_env() {
    print_status "Setting up production environment..."
    
    if [ ! -f .env ]; then
        if [ -f env.production ]; then
            cp env.production .env
            print_success "Created .env from production template"
        else
            print_error "No environment file found. Please create .env file."
            exit 1
        fi
    fi
    
    # Set production environment variables
    export NODE_ENV=production
    export DISABLE_SOURCE_MAPS=true
    export SECURE_HEADERS=true
    export LOG_LEVEL=warn
    
    print_success "Production environment configured"
}

# Create production directories with proper permissions
create_production_directories() {
    print_status "Creating production directories..."
    
    mkdir -p downloads cache temp logs nginx/ssl
    chmod 755 downloads cache temp logs
    chmod 700 nginx/ssl
    
    print_success "Production directories created"
}

# Build optimized images
build_production_images() {
    print_status "Building optimized production images..."
    
    # Build with no cache for fresh build
    docker-compose build --no-cache --parallel
    
    print_success "Production images built"
}

# Deploy with production settings
deploy_production() {
    print_status "Deploying to production..."
    
    # Stop existing containers
    docker-compose down --remove-orphans || true
    
    # Start with production settings
    docker-compose up -d
    
    print_success "Production deployment started"
}

# Wait for production services
wait_for_production_services() {
    print_status "Waiting for production services to be ready..."
    
    # Wait for backend
    print_status "Waiting for backend..."
    timeout 120 bash -c 'until docker-compose exec backend wget --no-verbose --tries=1 --spider http://localhost:3001/api/health; do sleep 5; done' || {
        print_error "Backend failed to start"
        docker-compose logs backend
        exit 1
    }
    
    # Wait for frontend
    print_status "Waiting for frontend..."
    timeout 60 bash -c 'until docker-compose exec frontend wget --no-verbose --tries=1 --spider http://localhost/; do sleep 3; done' || {
        print_error "Frontend failed to start"
        docker-compose logs frontend
        exit 1
    }
    
    # Wait for nginx
    print_status "Waiting for nginx..."
    timeout 30 bash -c 'until docker-compose exec nginx nginx -t; do sleep 2; done' || {
        print_error "Nginx failed to start"
        docker-compose logs nginx
        exit 1
    }
    
    print_success "All production services are ready"
}

# Setup monitoring and logging
setup_monitoring() {
    print_status "Setting up monitoring..."
    
    # Create log rotation script
    cat > rotate-logs.sh << 'EOF'
#!/bin/bash
# Log rotation script
find logs/ -name "*.log" -mtime +7 -delete
docker-compose exec nginx nginx -s reload
EOF
    
    chmod +x rotate-logs.sh
    
    # Add to crontab for daily log rotation
    (crontab -l 2>/dev/null; echo "0 2 * * * $(pwd)/rotate-logs.sh") | crontab -
    
    print_success "Monitoring configured"
}

# Show production status
show_production_status() {
    print_status "Production Deployment Status:"
    echo ""
    docker-compose ps
    echo ""
    
    # Show resource usage
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}"
    echo ""
    
    print_success "🎉 Production deployment completed successfully!"
    echo ""
    print_status "Your production application is running at:"
    echo "  🌐 HTTPS: https://yourdomain.com"
    echo "  🔧 API: https://yourdomain.com/api"
    echo "  📊 Health: https://yourdomain.com/api/health"
    echo ""
    print_status "Production commands:"
    echo "  📋 View logs: docker-compose logs -f"
    echo "  🔄 Restart: docker-compose restart"
    echo "  🛑 Stop: docker-compose down"
    echo "  📊 Status: docker-compose ps"
    echo "  🔍 Monitor: docker stats"
    echo ""
    print_warning "Remember to:"
    echo "  - Set up SSL certificates"
    echo "  - Configure your domain DNS"
    echo "  - Set up monitoring alerts"
    echo "  - Regular backups"
}

# Main production deployment function
main() {
    echo "=========================================="
    echo "🚀 YouTube to MP3 Converter - Production"
    echo "=========================================="
    echo ""
    
    check_root
    check_requirements
    setup_ssl
    setup_production_env
    create_production_directories
    build_production_images
    deploy_production
    wait_for_production_services
    setup_monitoring
    show_production_status
}

# Run main function
main "$@"
