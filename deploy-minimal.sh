#!/bin/bash

# Minimal deployment script
echo "🚀 Deploying..."

docker-compose down --remove-orphans
docker-compose up -d --build

echo "✅ Done! App running at http://localhost"
