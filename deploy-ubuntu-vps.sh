#!/bin/bash

# YouTube to MP3 Converter - Ubuntu VPS Deployment Script
# Updated with all fixes: Dockerfile, Tailwind CSS, Performance Optimizations

set -e  # Exit on any error

echo "🚀 Starting YouTube to MP3 Converter Deployment on Ubuntu VPS..."

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
    
    # Check if Docker is installed
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Installing Docker..."
        install_docker
    else
        print_success "Docker is installed"
    fi
    
    # Check if Docker Compose is installed
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose is not installed. Installing Docker Compose..."
        install_docker_compose
    else
        print_success "Docker Compose is installed"
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

# Install Docker
install_docker() {
    print_status "Installing Docker..."
    
    # Update package index
    sudo apt-get update
    
    # Install required packages
    sudo apt-get install -y \
        apt-transport-https \
        ca-certificates \
        curl \
        gnupg \
        lsb-release
    
    # Add Docker's official GPG key
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    
    # Set up stable repository
    echo \
        "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu \
        $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null
    
    # Update package index again
    sudo apt-get update
    
    # Install Docker Engine
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io
    
    # Add current user to docker group
    sudo usermod -aG docker $USER
    
    print_success "Docker installed successfully"
    print_warning "Please log out and log back in for Docker group changes to take effect"
}

# Install Docker Compose
install_docker_compose() {
    print_status "Installing Docker Compose..."
    
    # Get latest version
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | grep 'tag_name' | cut -d\" -f4)
    
    # Download and install
    sudo curl -L "https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    
    # Make executable
    sudo chmod +x /usr/local/bin/docker-compose
    
    print_success "Docker Compose installed successfully"
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
    chmod 755 downloads cache temp logs
    chmod 700 nginx/ssl
    print_success "Directories created with proper permissions"
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
    
    # Build images with no cache for fresh build
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
    timeout 120 bash -c 'until docker-compose exec backend wget --no-verbose --tries=1 --spider http://localhost:3001/api/health; do sleep 5; done' || {
        print_error "Backend failed to start within 120 seconds"
        docker-compose logs backend
        exit 1
    }
    
    # Wait for frontend
    print_status "Waiting for frontend to be ready..."
    timeout 60 bash -c 'until docker-compose exec frontend wget --no-verbose --tries=1 --spider http://localhost/; do sleep 3; done' || {
        print_error "Frontend failed to start within 60 seconds"
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

# Setup firewall
setup_firewall() {
    print_status "Setting up firewall..."
    
    # Check if ufw is installed
    if command -v ufw &> /dev/null; then
        # Allow SSH
        sudo ufw allow ssh
        
        # Allow HTTP and HTTPS
        sudo ufw allow 80
        sudo ufw allow 443
        
        # Enable firewall
        sudo ufw --force enable
        
        print_success "Firewall configured"
    else
        print_warning "UFW not installed. Please configure firewall manually."
    fi
}

# Setup SSL certificates (optional)
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if [ ! -f "nginx/ssl/fullchain.pem" ] || [ ! -f "nginx/ssl/privkey.pem" ]; then
        print_warning "SSL certificates not found in nginx/ssl/"
        print_status "For Let's Encrypt, you can use:"
        echo "  sudo apt install certbot"
        echo "  sudo certbot certonly --standalone -d yourdomain.com"
        echo "  sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/"
        echo "  sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/"
        echo ""
        read -p "Press Enter to continue without SSL (you can add SSL later)..."
    else
        print_success "SSL certificates found"
    fi
}

# Setup monitoring
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

# Show deployment status
show_status() {
    print_status "Deployment Status:"
    echo ""
    docker-compose ps
    echo ""
    
    # Show resource usage
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" 2>/dev/null || true
    echo ""
    
    print_success "🎉 Deployment completed successfully!"
    echo ""
    print_status "Your application is now running at:"
    echo "  🌐 Frontend: http://$(curl -s ifconfig.me)"
    echo "  🔧 Backend API: http://$(curl -s ifconfig.me)/api"
    echo "  📊 Health Check: http://$(curl -s ifconfig.me)/api/health"
    echo ""
    print_status "Useful commands:"
    echo "  📋 View logs: docker-compose logs -f"
    echo "  🔄 Restart: docker-compose restart"
    echo "  🛑 Stop: docker-compose down"
    echo "  📊 Status: docker-compose ps"
    echo "  🔍 Monitor: docker stats"
    echo ""
    print_warning "Next steps:"
    echo "  - Configure your domain DNS to point to this server"
    echo "  - Set up SSL certificates with Let's Encrypt"
    echo "  - Configure monitoring alerts"
    echo "  - Set up regular backups"
}

# Main deployment function
main() {
    echo "=========================================="
    echo "🚀 YouTube to MP3 Converter - Ubuntu VPS"
    echo "=========================================="
    echo ""
    
    check_root
    check_requirements
    check_env
    create_directories
    stop_containers
    deploy_services
    wait_for_services
    setup_firewall
    setup_ssl
    setup_monitoring
    show_status
}

# Run main function
main "$@"
