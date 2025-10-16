#!/bin/bash

echo "🔧 Fixing PostgreSQL database configuration on Ubuntu VPS..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Step 1: Stop all containers
print_status "Step 1: Stopping all containers..."
docker-compose down

# Step 2: Ensure .env file exists
print_status "Step 2: Ensuring .env file exists..."
if [ ! -f .env ]; then
    cp env.production .env
    print_success "Created .env file from env.production"
else
    print_status ".env file already exists"
fi

# Step 3: Start PostgreSQL first
print_status "Step 3: Starting PostgreSQL first..."
docker-compose up -d postgres

# Step 4: Wait for PostgreSQL to be ready
print_status "Step 4: Waiting for PostgreSQL to be ready..."
sleep 20

# Step 5: Create database and user
print_status "Step 5: Creating database and user..."
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE youtube_converter;" 2>/dev/null || print_warning "Database might already exist"
docker-compose exec -T postgres psql -U postgres -c "CREATE USER ytmp3_user WITH PASSWORD 'ytmp3_password';" 2>/dev/null || print_warning "User might already exist"

# Step 6: Initialize database schema
print_status "Step 6: Initializing database schema..."
docker-compose exec -T postgres psql -U postgres -d youtube_converter -f /docker-entrypoint-initdb.d/init.sql

# Step 7: Add missing column
print_status "Step 7: Adding missing column..."
docker-compose exec -T postgres psql -U postgres -d youtube_converter -c "ALTER TABLE conversions ADD COLUMN IF NOT EXISTS direct_download_url TEXT;" 2>/dev/null || print_warning "Column might already exist"

# Step 8: Set permissions
print_status "Step 8: Setting permissions..."
docker-compose exec -T postgres psql -U postgres -d youtube_converter -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ytmp3_user;" 2>/dev/null || print_warning "Permissions might already be set"
docker-compose exec -T postgres psql -U postgres -d youtube_converter -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ytmp3_user;" 2>/dev/null || print_warning "Sequence permissions might already be set"

# Step 9: Rebuild backend
print_status "Step 9: Rebuilding backend..."
docker-compose build --no-cache backend

# Step 10: Start all services
print_status "Step 10: Starting all services..."
docker-compose up -d

# Step 11: Wait for services to start
print_status "Step 11: Waiting for services to start..."
sleep 30

# Step 12: Test backend
print_status "Step 12: Testing backend..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "✅ Backend is healthy and using PostgreSQL!"
    
    # Test conversion
    print_status "Testing conversion..."
    JOB_RESPONSE=$(curl -s -X POST http://localhost:3001/api/convert \
      -H "Content-Type: application/json" \
      -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}')
    
    if echo "$JOB_RESPONSE" | grep -q "jobId"; then
        print_success "✅ Conversion test successful!"
        JOB_ID=$(echo "$JOB_RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
        print_status "Job ID: $JOB_ID"
    else
        print_error "❌ Conversion test failed"
        print_status "Backend logs:"
        docker-compose logs backend | tail -10
    fi
else
    print_error "❌ Backend still has issues"
    print_status "Backend logs:"
    docker-compose logs backend | tail -20
fi

print_success "🎉 PostgreSQL configuration fix completed!"
