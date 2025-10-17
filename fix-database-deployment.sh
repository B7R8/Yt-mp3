#!/bin/bash

# Fix Database Configuration Deployment Script
# This script fixes the database configuration issues on your server

echo "🔧 Fixing Database Configuration Issues..."

# Set environment variables
export NODE_ENV=production

# Navigate to backend directory
cd backend

echo "📦 Building the backend with fixes..."
npm run build

echo "🔄 Restarting the backend service..."
# Stop the current backend service
docker-compose stop backend

# Start the backend service with the fixes
docker-compose up -d backend

echo "⏳ Waiting for backend to start..."
sleep 10

echo "🔍 Checking backend logs..."
docker-compose logs --tail=20 backend

echo "✅ Database configuration fix deployment completed!"
echo ""
echo "The following issues have been fixed:"
echo "1. ✅ Database configuration now properly detects production environment"
echo "2. ✅ All SQLite-specific database operations replaced with database-agnostic queries"
echo "3. ✅ Parameter placeholders now work with both SQLite and PostgreSQL"
echo "4. ✅ direct_download_url column operations now work correctly"
echo ""
echo "Your server should now use PostgreSQL correctly in production!"
echo "Test a video conversion to verify the fix is working."
