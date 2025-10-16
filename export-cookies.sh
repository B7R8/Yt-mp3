#!/bin/bash

# Manual script to export YouTube cookies from Firefox
# Run this on your server to export cookies

echo "🍪 YouTube Cookie Exporter for Firefox"
echo "======================================"

# Check if Firefox is installed
if ! command -v firefox-real &> /dev/null && ! command -v firefox &> /dev/null; then
    echo "❌ Firefox not found. Please install Firefox first."
    echo "   Ubuntu/Debian: sudo apt install firefox"
    echo "   CentOS/RHEL: sudo yum install firefox"
    exit 1
fi

# Check if Firefox profile exists
FIREFOX_PROFILE="/home/sfnx2/.mozilla/firefox/g2swbyzy.default-release"
if [ ! -d "$FIREFOX_PROFILE" ]; then
    echo "⚠️  Firefox profile not found at: $FIREFOX_PROFILE"
    echo "🔍 Searching for Firefox profiles..."
    
    # Search for Firefox profiles
    for profile_dir in /home/*/.mozilla/firefox/*/; do
        if [ -d "$profile_dir" ] && [ -f "$profile_dir/cookies.sqlite" ]; then
            echo "✅ Found Firefox profile: $profile_dir"
            FIREFOX_PROFILE="$profile_dir"
            break
        fi
    done
    
    if [ ! -d "$FIREFOX_PROFILE" ]; then
        echo "❌ No Firefox profile with cookies found"
        echo "💡 Make sure you're logged into YouTube in Firefox"
        exit 1
    fi
fi

echo "🍪 Using Firefox profile: $FIREFOX_PROFILE"

# Check if Python 3 is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 not found. Please install Python 3 first."
    exit 1
fi

# Create cookies directory
mkdir -p backend/cookies

# Copy the export script to backend
cp backend/scripts/export-firefox-cookies.py backend/cookies/

# Run the export script
echo "🔄 Exporting cookies from Firefox..."
cd backend/cookies
python3 export-firefox-cookies.py

# Check if cookies were exported
if [ -f "youtube_cookies.txt" ] && [ -s "youtube_cookies.txt" ]; then
    echo "✅ Cookies exported successfully!"
    echo "📁 Location: backend/cookies/youtube_cookies.txt"
    echo "📊 Number of cookies: $(grep -v '^#' youtube_cookies.txt | wc -l)"
    
    # Show cookie domains
    echo "🌐 Cookie domains:"
    grep -v '^#' youtube_cookies.txt | awk -F'\t' '{print "  " $1}' | sort | uniq
    
    echo ""
    echo "🚀 Cookies are ready! Restart your backend service:"
    echo "   docker-compose restart backend"
    
else
    echo "❌ Failed to export cookies"
    echo "💡 Make sure:"
    echo "   1. Firefox is installed and you're logged into YouTube"
    echo "   2. Firefox profile is accessible"
    echo "   3. You have permission to read Firefox data"
fi
