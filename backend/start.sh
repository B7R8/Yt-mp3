#!/bin/sh

# Fix permissions on startup
chmod -R 777 /app/downloads 2>/dev/null || true
chmod -R 777 /app/cache 2>/dev/null || true
chmod -R 777 /app/temp 2>/dev/null || true
chmod -R 777 /app/logs 2>/dev/null || true

# Start the application
exec npm start
