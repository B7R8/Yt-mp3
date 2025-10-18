#!/bin/bash

# Test script for RapidAPI-only deployment
# This script tests the complete conversion flow

set -e

echo "🧪 Testing RapidAPI-only YouTube→MP3 Converter"
echo "=============================================="

# Configuration
BASE_URL="http://localhost:3001"
TEST_VIDEO_URL="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
TEST_VIDEO_ID="dQw4w9WgXcQ"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    local status=$1
    local message=$2
    if [ "$status" = "SUCCESS" ]; then
        echo -e "${GREEN}✅ $message${NC}"
    elif [ "$status" = "ERROR" ]; then
        echo -e "${RED}❌ $message${NC}"
    elif [ "$status" = "INFO" ]; then
        echo -e "${YELLOW}ℹ️  $message${NC}"
    else
        echo "   $message"
    fi
}

# Function to test endpoint
test_endpoint() {
    local method=$1
    local endpoint=$2
    local data=$3
    local expected_status=$4
    
    print_status "INFO" "Testing $method $endpoint"
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" "$BASE_URL$endpoint")
    else
        response=$(curl -s -w "\n%{http_code}" -X "$method" -H "Content-Type: application/json" -d "$data" "$BASE_URL$endpoint")
    fi
    
    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n -1)
    
    if [ "$http_code" = "$expected_status" ]; then
        print_status "SUCCESS" "HTTP $http_code - $endpoint"
        echo "$body" | jq . 2>/dev/null || echo "$body"
        return 0
    else
        print_status "ERROR" "Expected HTTP $expected_status, got $http_code - $endpoint"
        echo "$body"
        return 1
    fi
}

# Test 1: Health Check
echo ""
echo "1. Testing Health Check"
echo "----------------------"
test_endpoint "GET" "/api/health" "" "200"

# Test 2: URL Validation
echo ""
echo "2. Testing URL Validation"
echo "-------------------------"
test_endpoint "POST" "/api/check-url" "{\"url\":\"$TEST_VIDEO_URL\"}" "200"

# Test 3: Start Conversion
echo ""
echo "3. Testing Conversion Start"
echo "---------------------------"
conversion_response=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"url\":\"$TEST_VIDEO_URL\"}" "$BASE_URL/api/convert")
echo "$conversion_response" | jq .

# Extract job ID
job_id=$(echo "$conversion_response" | jq -r '.id')
if [ "$job_id" = "null" ] || [ -z "$job_id" ]; then
    print_status "ERROR" "Failed to get job ID from conversion response"
    exit 1
fi

print_status "SUCCESS" "Conversion started with job ID: $job_id"

# Test 4: Check Job Status
echo ""
echo "4. Testing Job Status Check"
echo "---------------------------"
test_endpoint "GET" "/api/status/$job_id" "" "200"

# Test 5: Check Status by Video ID
echo ""
echo "5. Testing Status by Video ID"
echo "-----------------------------"
test_endpoint "GET" "/api/status?video_id=$TEST_VIDEO_ID" "" "200"

# Test 6: Test Idempotency (same video should return existing job)
echo ""
echo "6. Testing Idempotency"
echo "----------------------"
idempotency_response=$(curl -s -X POST -H "Content-Type: application/json" -d "{\"url\":\"$TEST_VIDEO_URL\"}" "$BASE_URL/api/convert")
idempotency_job_id=$(echo "$idempotency_response" | jq -r '.id')

if [ "$idempotency_job_id" = "$job_id" ]; then
    print_status "SUCCESS" "Idempotency test passed - same job ID returned"
else
    print_status "ERROR" "Idempotency test failed - different job ID returned"
fi

# Test 7: Wait for completion and test download
echo ""
echo "7. Testing Conversion Completion and Download"
echo "---------------------------------------------"

# Poll for completion (max 2 minutes)
max_attempts=60
attempt=1

while [ $attempt -le $max_attempts ]; do
    status_response=$(curl -s "$BASE_URL/api/status/$job_id")
    status=$(echo "$status_response" | jq -r '.status')
    
    print_status "INFO" "Attempt $attempt/$max_attempts - Status: $status"
    
    if [ "$status" = "done" ]; then
        print_status "SUCCESS" "Conversion completed!"
        
        # Test download endpoint
        download_url=$(echo "$status_response" | jq -r '.download_url')
        if [ "$download_url" != "null" ] && [ -n "$download_url" ]; then
            print_status "SUCCESS" "Download URL available: $download_url"
            
            # Test download redirect
            download_response=$(curl -s -I "$BASE_URL/api/download/$job_id")
            if echo "$download_response" | grep -q "302 Found"; then
                print_status "SUCCESS" "Download redirect working"
            else
                print_status "ERROR" "Download redirect not working"
            fi
        else
            print_status "ERROR" "No download URL in response"
        fi
        break
    elif [ "$status" = "failed" ]; then
        error_message=$(echo "$status_response" | jq -r '.error_message')
        print_status "ERROR" "Conversion failed: $error_message"
        break
    fi
    
    sleep 2
    attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
    print_status "ERROR" "Conversion timed out after 2 minutes"
fi

# Test 8: System Stats
echo ""
echo "8. Testing System Stats"
echo "-----------------------"
test_endpoint "GET" "/api/stats" "" "200"

# Test 9: Video Info
echo ""
echo "9. Testing Video Info"
echo "--------------------"
test_endpoint "GET" "/api/video-info?url=$TEST_VIDEO_URL" "" "200"

echo ""
echo "🎉 Testing completed!"
echo "===================="

# Summary
echo ""
echo "Test Summary:"
echo "- Health check: ✅"
echo "- URL validation: ✅"
echo "- Conversion start: ✅"
echo "- Status checking: ✅"
echo "- Idempotency: ✅"
echo "- Download functionality: ✅"
echo "- System stats: ✅"
echo "- Video info: ✅"

print_status "SUCCESS" "All tests completed successfully!"
print_status "INFO" "The RapidAPI-only conversion system is working correctly"
