#!/bin/bash

# Script to refresh Firefox cookies for YouTube
# This script should be run periodically to keep cookies fresh

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BACKEND_DIR="$(dirname "$SCRIPT_DIR")"
COOKIES_DIR="$BACKEND_DIR/cookies"
COOKIES_FILE="$COOKIES_DIR/youtube_cookies.txt"

echo "🔄 Refreshing YouTube cookies from Firefox..."

# Create cookies directory if it doesn't exist
mkdir -p "$COOKIES_DIR"

# Run the Python script to export cookies
cd "$SCRIPT_DIR"
python3 export-firefox-cookies.py

# Check if cookies were exported successfully
if [ -f "$COOKIES_FILE" ] && [ -s "$COOKIES_FILE" ]; then
    echo "✅ Cookies refreshed successfully!"
    echo "📁 Cookies file: $COOKIES_FILE"
    echo "📊 File size: $(wc -l < "$COOKIES_FILE") lines"
    
    # Show when cookies were last updated
    echo "🕒 Last updated: $(date)"
    
    # Check cookie expiry dates
    echo "📅 Cookie expiry info:"
    grep -v "^#" "$COOKIES_FILE" | awk -F'\t' '{
        if ($5 != "0") {
            expiry = $5
            if (expiry > 1000000000) {  # Unix timestamp
                cmd = "date -d @" expiry " 2>/dev/null || date -r " expiry " 2>/dev/null"
                cmd | getline date_str
                close(cmd)
                print "  " $3 " expires: " date_str
            }
        }
    }' | head -5
    
else
    echo "❌ Failed to refresh cookies"
    exit 1
fi
