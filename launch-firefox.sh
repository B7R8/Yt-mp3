#!/bin/bash

# Script to launch Firefox in headless mode to refresh cookies
# This ensures your YouTube session is active

echo "🦊 Launching Firefox to refresh YouTube session..."

# Check if Firefox is installed
if command -v firefox-real &> /dev/null; then
    FIREFOX_CMD="firefox-real"
elif command -v firefox &> /dev/null; then
    FIREFOX_CMD="firefox"
else
    echo "❌ Firefox not found. Please install Firefox first."
    exit 1
fi

echo "Using Firefox command: $FIREFOX_CMD"

# Launch Firefox in headless mode to refresh session
echo "🔄 Starting Firefox in headless mode..."
$FIREFOX_CMD --headless --new-instance --no-remote --profile /home/sfnx2/.mozilla/firefox/g2swbyzy.default-release &

# Wait a moment for Firefox to start
sleep 5

# Get the Firefox process ID
FIREFOX_PID=$!

echo "✅ Firefox started with PID: $FIREFOX_PID"
echo "🕒 Firefox will run for 30 seconds to refresh cookies..."

# Wait 30 seconds for cookies to refresh
sleep 30

# Kill Firefox
echo "🛑 Stopping Firefox..."
kill $FIREFOX_PID 2>/dev/null

echo "✅ Firefox session refreshed!"
echo "🍪 Cookies should now be fresh and ready to export"
