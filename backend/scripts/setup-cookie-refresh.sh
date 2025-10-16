#!/bin/bash

# Setup automatic cookie refresh for YouTube
# This script sets up a cron job to refresh cookies every 6 hours

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
REFRESH_SCRIPT="$SCRIPT_DIR/refresh-cookies.sh"

echo "🔧 Setting up automatic cookie refresh..."

# Make scripts executable
chmod +x "$REFRESH_SCRIPT"
chmod +x "$SCRIPT_DIR/export-firefox-cookies.py"

# Create cookies directory
mkdir -p "$BACKEND_DIR/cookies"

# Add cron job to refresh cookies every 6 hours
CRON_JOB="0 */6 * * * $REFRESH_SCRIPT >> $BACKEND_DIR/logs/cookie-refresh.log 2>&1"

# Check if cron job already exists
if crontab -l 2>/dev/null | grep -q "refresh-cookies.sh"; then
    echo "⚠️  Cookie refresh cron job already exists"
else
    # Add the cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    echo "✅ Added cron job to refresh cookies every 6 hours"
fi

# Show current cron jobs
echo "📋 Current cron jobs:"
crontab -l | grep -E "(refresh-cookies|cookie)" || echo "No cookie-related cron jobs found"

# Run initial cookie export
echo "🔄 Running initial cookie export..."
"$REFRESH_SCRIPT"

echo "✅ Cookie refresh setup complete!"
echo "📁 Cookies will be stored in: $BACKEND_DIR/cookies/"
echo "🕒 Cookies will be refreshed every 6 hours"
echo "📝 Logs will be written to: $BACKEND_DIR/logs/cookie-refresh.log"
