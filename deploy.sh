#!/bin/bash

# YouTube-to-MP3 Converter - Quick Deploy Script
# This script sets up the optimized converter with all performance improvements

set -e

echo "🚀 YouTube-to-MP3 Converter - Performance Optimization Deployment"
echo "================================================================"

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
if [[ $EUID -eq 0 ]]; then
   print_error "This script should not be run as root for security reasons"
   exit 1
fi

# Check system requirements
print_status "Checking system requirements..."

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

# Check available memory
TOTAL_MEM=$(free -m | awk 'NR==2{printf "%.0f", $2}')
if [ $TOTAL_MEM -lt 4096 ]; then
    print_warning "System has less than 4GB RAM. Performance may be limited."
fi

# Check available disk space
AVAILABLE_SPACE=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
if [ $AVAILABLE_SPACE -lt 20 ]; then
    print_warning "Less than 20GB disk space available. Consider freeing up space."
fi

print_success "System requirements check completed"

# Create necessary directories
print_status "Creating necessary directories..."
mkdir -p downloads cache temp logs nginx/ssl monitoring/grafana/dashboards monitoring/grafana/datasources
print_success "Directories created"

# Set proper permissions
print_status "Setting directory permissions..."
chmod 755 downloads cache temp logs
chmod 600 nginx/ssl/* 2>/dev/null || true
print_success "Permissions set"

# Create environment files if they don't exist
print_status "Setting up environment configuration..."

if [ ! -f backend/.env ]; then
    cat > backend/.env << EOF
# Server Configuration
PORT=3000
NODE_ENV=production

# Database Configuration
DB_MAX_CONNECTIONS=20
DB_PATH=./conversions.db

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_DB=0

# Performance Settings
MAX_WORKERS=4
MAX_CONCURRENT_JOBS=10
MAX_CACHE_SIZE=1000
CACHE_TTL=3600000

# File Management
DOWNLOADS_DIR=./downloads
CACHE_DIR=./cache
TEMP_DIR=./temp
MAX_FILE_AGE_HOURS=24

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=20

# Security
JWT_SECRET=$(openssl rand -base64 32)
ENCRYPTION_KEY=$(openssl rand -base64 32)
EOF
    print_success "Backend environment file created"
else
    print_warning "Backend environment file already exists"
fi

# Create Prometheus configuration
print_status "Creating monitoring configuration..."
cat > monitoring/prometheus.yml << EOF
global:
  scrape_interval: 15s
  evaluation_interval: 15s

rule_files:
  # - "first_rules.yml"
  # - "second_rules.yml"

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'yt-mp3-backend'
    static_configs:
      - targets: ['backend:3000']
    metrics_path: '/metrics'
    scrape_interval: 5s

  - job_name: 'redis'
    static_configs:
      - targets: ['redis:6379']
EOF

# Create Grafana datasource configuration
cat > monitoring/grafana/datasources/prometheus.yml << EOF
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
    editable: true
EOF

print_success "Monitoring configuration created"

# Build and start services
print_status "Building and starting services..."
docker-compose down --remove-orphans 2>/dev/null || true
docker-compose build --no-cache
docker-compose up -d

# Wait for services to be ready
print_status "Waiting for services to start..."
sleep 30

# Health checks
print_status "Performing health checks..."

# Check Redis
if docker-compose exec -T redis redis-cli ping | grep -q "PONG"; then
    print_success "Redis is healthy"
else
    print_error "Redis health check failed"
fi

# Check Backend
if curl -f http://localhost:3000/api/health > /dev/null 2>&1; then
    print_success "Backend is healthy"
else
    print_error "Backend health check failed"
fi

# Check Frontend
if curl -f http://localhost/ > /dev/null 2>&1; then
    print_success "Frontend is healthy"
else
    print_error "Frontend health check failed"
fi

# Display service information
echo ""
echo "🎉 Deployment completed successfully!"
echo "=================================="
echo ""
echo "📊 Service URLs:"
echo "  Frontend:     http://localhost/"
echo "  Backend API:  http://localhost:3000/api/"
echo "  Prometheus:   http://localhost:9090"
echo "  Grafana:      http://localhost:3001 (admin/admin)"
echo ""
echo "📈 Performance Features Enabled:"
echo "  ✅ Parallel processing with worker threads"
echo "  ✅ Redis caching and job queue"
echo "  ✅ Database connection pooling"
echo "  ✅ Nginx load balancing"
echo "  ✅ Monitoring with Prometheus & Grafana"
echo "  ✅ Optimized FFmpeg settings"
echo "  ✅ Intelligent file caching"
echo ""
echo "🔧 Management Commands:"
echo "  View logs:     docker-compose logs -f"
echo "  Stop services: docker-compose down"
echo "  Restart:       docker-compose restart"
echo "  Update:        ./deploy.sh"
echo ""
echo "📋 Next Steps:"
echo "  1. Configure SSL certificates in nginx/ssl/"
echo "  2. Update domain name in nginx/nginx.conf"
echo "  3. Set up monitoring alerts in Grafana"
echo "  4. Configure backup strategy for Redis data"
echo ""
echo "🚀 Your optimized YouTube-to-MP3 converter is ready!"

# Show current resource usage
echo ""
echo "📊 Current Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
