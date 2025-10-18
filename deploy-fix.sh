#!/bin/bash

# Quick deployment fix for PostgreSQL datetime function error
echo "🔧 Fixing PostgreSQL datetime function error..."

# Build the updated backend
echo "📦 Building updated backend..."
cd backend
npm run build
cd ..

# Deploy the fix
echo "🚀 Deploying fix..."
docker-compose up -d --build backend

# Wait for restart
echo "⏳ Waiting for backend to restart..."
sleep 10

# Test the fix
echo "🧪 Testing the fix..."
curl -X POST http://localhost/api/convert \
  -H "Content-Type: application/json" \
  -d '{"url":"https://youtube.com/watch?v=dQw4w9WgXcQ"}'

echo ""
echo "✅ Fix deployed! Check the logs with: docker-compose logs -f backend"
