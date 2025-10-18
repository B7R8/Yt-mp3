#!/bin/bash

echo "🚨 Running Emergency Database Fix..."

# Run the emergency fix
docker-compose exec postgres psql -U postgres -d youtube_converter -f /tmp/emergency-fix.sql

echo "✅ Emergency fix completed!"
echo "🔄 Restarting backend..."

# Restart the backend
docker-compose restart backend

echo "🎉 All done! Backend should be working now."
