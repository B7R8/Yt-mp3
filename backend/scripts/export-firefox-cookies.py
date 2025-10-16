#!/usr/bin/env python3
"""
Script to export Firefox cookies for YouTube and save them in Netscape format
for use with yt-dlp
"""

import os
import sqlite3
import json
import time
from pathlib import Path

def get_firefox_profile_path():
    """Get the default Firefox profile path"""
    home = Path.home()
    
    # Common Firefox profile locations
    firefox_paths = [
        home / ".mozilla" / "firefox",
        home / "AppData" / "Roaming" / "Mozilla" / "Firefox",
        home / "Library" / "Application Support" / "Firefox"
    ]
    
    for firefox_path in firefox_paths:
        if firefox_path.exists():
            profiles_ini = firefox_path / "profiles.ini"
            if profiles_ini.exists():
                return firefox_path
    
    return None

def get_firefox_profile_path_manual():
    """Get Firefox profile path manually for Ubuntu server"""
    # Common Ubuntu Firefox profile paths
    possible_paths = [
        Path("/home/sfnx2/.mozilla/firefox/g2swbyzy.default-release"),
        Path("/home/sfnx2/.mozilla/firefox"),
        Path("/root/.mozilla/firefox"),
        Path.home() / ".mozilla" / "firefox"
    ]
    
    for path in possible_paths:
        if path.exists():
            # Look for profile directories
            for item in path.iterdir():
                if item.is_dir() and ("default" in item.name or "release" in item.name):
                    cookies_file = item / "cookies.sqlite"
                    if cookies_file.exists():
                        print(f"Found Firefox profile: {item}")
                        return item
    
    return None

def get_default_profile(firefox_path):
    """Get the default Firefox profile"""
    profiles_ini = firefox_path / "profiles.ini"
    
    if not profiles_ini.exists():
        return None
    
    with open(profiles_ini, 'r') as f:
        content = f.read()
    
    # Find the default profile
    for line in content.split('\n'):
        if line.startswith('Default='):
            return line.split('=')[1].strip()
        elif line.startswith('Name=') and 'default' in line.lower():
            # Get the next line which should be Path=
            lines = content.split('\n')
            for i, l in enumerate(lines):
                if l == line:
                    if i + 1 < len(lines) and lines[i + 1].startswith('Path='):
                        return lines[i + 1].split('=')[1].strip()
    
    return None

def export_youtube_cookies(profile_path, output_file):
    """Export YouTube cookies from Firefox to Netscape format"""
    cookies_db = profile_path / "cookies.sqlite"
    
    if not cookies_db.exists():
        print(f"Cookies database not found: {cookies_db}")
        return False
    
    try:
        # Connect to Firefox cookies database
        conn = sqlite3.connect(str(cookies_db))
        cursor = conn.cursor()
        
        # Get YouTube cookies
        cursor.execute("""
            SELECT name, value, host, path, expiry, isSecure, isHttpOnly
            FROM moz_cookies 
            WHERE host LIKE '%youtube.com%' OR host LIKE '%google.com%'
            ORDER BY host, name
        """)
        
        cookies = cursor.fetchall()
        conn.close()
        
        if not cookies:
            print("No YouTube cookies found in Firefox")
            return False
        
        # Write cookies in Netscape format
        with open(output_file, 'w') as f:
            f.write("# Netscape HTTP Cookie File\n")
            f.write("# This is a generated file! Do not edit.\n\n")
            
            for cookie in cookies:
                name, value, host, path, expiry, is_secure, is_http_only = cookie
                
                # Convert expiry timestamp
                if expiry and expiry > 0:
                    expiry_str = str(expiry)
                else:
                    expiry_str = "0"
                
                # Format the cookie line
                domain = host if host.startswith('.') else f".{host}"
                secure = "TRUE" if is_secure else "FALSE"
                http_only = "TRUE" if is_http_only else "FALSE"
                
                f.write(f"{domain}\tTRUE\t{path}\t{secure}\t{expiry_str}\t{name}\t{value}\n")
        
        print(f"Exported {len(cookies)} YouTube cookies to {output_file}")
        return True
        
    except Exception as e:
        print(f"Error exporting cookies: {e}")
        return False

def main():
    """Main function"""
    # Try automatic detection first
    firefox_path = get_firefox_profile_path()
    profile_path = None
    
    if firefox_path:
        print(f"Found Firefox at: {firefox_path}")
        profile_name = get_default_profile(firefox_path)
        if profile_name:
            profile_path = firefox_path / profile_name
            print(f"Using profile: {profile_path}")
    
    # If automatic detection failed, try manual detection
    if not profile_path:
        print("Automatic detection failed, trying manual detection...")
        profile_path = get_firefox_profile_path_manual()
    
    if not profile_path:
        print("❌ Firefox profile not found")
        print("💡 Make sure Firefox is installed and you're logged into YouTube")
        print("💡 Try running: firefox-real --headless --new-instance")
        return False
    
    print(f"✅ Using Firefox profile: {profile_path}")
    
    # Create cookies directory
    cookies_dir = Path(__file__).parent.parent / "cookies"
    cookies_dir.mkdir(exist_ok=True)
    
    output_file = cookies_dir / "youtube_cookies.txt"
    
    success = export_youtube_cookies(profile_path, output_file)
    
    if success:
        print(f"✅ Cookies exported successfully to: {output_file}")
        return True
    else:
        print("❌ Failed to export cookies")
        return False

if __name__ == "__main__":
    main()
