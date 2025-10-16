#!/bin/bash

echo "🔧 Complete Backend Fix - Force PostgreSQL Usage"

# Colors
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

# Step 1: Stop all containers
print_status "Step 1: Stopping all containers..."
docker-compose down

# Step 2: Remove old compiled files
print_status "Step 2: Removing old compiled files..."
rm -rf backend/dist/
rm -rf backend/node_modules/

# Step 3: Ensure .env file exists
print_status "Step 3: Ensuring .env file exists..."
if [ ! -f .env ]; then
    cp env.production .env
    print_success "Created .env file from env.production"
fi

# Step 4: Force PostgreSQL in database config
print_status "Step 4: Forcing PostgreSQL usage in code..."
sed -i 's/const useSQLite = .*/const useSQLite = false; \/\/ Always use PostgreSQL/' backend/src/config/database.ts

# Step 5: Start PostgreSQL first
print_status "Step 5: Starting PostgreSQL first..."
docker-compose up -d postgres

# Step 6: Wait for PostgreSQL
print_status "Step 6: Waiting for PostgreSQL to be ready..."
sleep 20

# Step 7: Create database and user
print_status "Step 7: Creating database and user..."
docker-compose exec -T postgres psql -U postgres -c "CREATE DATABASE youtube_converter;" 2>/dev/null || print_status "Database might already exist"
docker-compose exec -T postgres psql -U postgres -c "CREATE USER ytmp3_user WITH PASSWORD 'ytmp3_password';" 2>/dev/null || print_status "User might already exist"

# Step 8: Initialize database schema
print_status "Step 8: Initializing database schema..."
docker-compose exec -T postgres psql -U postgres -d youtube_converter -f /docker-entrypoint-initdb.d/init.sql

# Step 9: Add missing column
print_status "Step 9: Adding missing column..."
docker-compose exec -T postgres psql -U postgres -d youtube_converter -c "ALTER TABLE conversions ADD COLUMN IF NOT EXISTS direct_download_url TEXT;" 2>/dev/null || print_status "Column might already exist"

# Step 10: Set permissions
print_status "Step 10: Setting permissions..."
docker-compose exec -T postgres psql -U postgres -d youtube_converter -c "GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO ytmp3_user;" 2>/dev/null || print_status "Permissions might already be set"
docker-compose exec -T postgres psql -U postgres -d youtube_converter -c "GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO ytmp3_user;" 2>/dev/null || print_status "Sequence permissions might already be set"

# Step 11: Rebuild backend completely
print_status "Step 11: Rebuilding backend completely..."
docker-compose build --no-cache backend

# Step 12: Start all services
print_status "Step 12: Starting all services..."
docker-compose up -d

# Step 13: Wait for services to start
print_status "Step 13: Waiting for services to start..."
sleep 45

# Step 14: Check backend logs
print_status "Step 14: Checking backend logs..."
docker-compose logs backend | tail -20

# Step 15: Test backend
print_status "Step 15: Testing backend..."
if curl -f http://localhost:3001/api/health > /dev/null 2>&1; then
    print_success "✅ Backend is healthy!"
    
    # Test conversion
    print_status "Testing conversion..."
    JOB_RESPONSE=$(curl -s -X POST http://localhost:3001/api/convert \
      -H "Content-Type: application/json" \
      -d '{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}')
    
    if echo "$JOB_RESPONSE" | grep -q "jobId"; then
        print_success "✅ Conversion test successful!"
        JOB_ID=$(echo "$JOB_RESPONSE" | grep -o '"jobId":"[^"]*"' | cut -d'"' -f4)
        print_status "Job ID: $JOB_ID"
        
        # Wait and check status
        sleep 5
        STATUS_RESPONSE=$(curl -s "http://localhost:3001/api/status/$JOB_ID")
        print_status "Job status response: $STATUS_RESPONSE"
    else
        print_error "❌ Conversion test failed"
        print_status "Response: $JOB_RESPONSE"
    fi
else
    print_error "❌ Backend health check failed"
    print_status "Backend logs:"
    docker-compose logs backend | tail -30
fi

print_success "🎉 Complete backend fix completed!"
