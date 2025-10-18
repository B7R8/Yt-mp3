// Test script to verify multi-key fallback system
// This script tests the RapidAPI key fallback functionality

const { YouTubeMp3ApiService } = require('./backend/dist/services/youtubeMp3ApiService');

async function testMultiKeyFallback() {
    console.log('🧪 Testing Multi-Key Fallback System');
    console.log('=====================================');
    
    // Check environment variables
    console.log('\n📋 Environment Variables:');
    console.log(`RAPIDAPI_KEY: ${process.env.RAPIDAPI_KEY ? '✅ Set' : '❌ Not set'}`);
    console.log(`RAPIDAPI_KEY2: ${process.env.RAPIDAPI_KEY2 ? '✅ Set' : '❌ Not set'}`);
    console.log(`RAPIDAPI_KEY3: ${process.env.RAPIDAPI_KEY3 ? '✅ Set' : '❌ Not set'}`);
    console.log(`RAPIDAPI_KEY4: ${process.env.RAPIDAPI_KEY4 ? '✅ Set' : '❌ Not set'}`);
    console.log(`RAPIDAPI_KEY5: ${process.env.RAPIDAPI_KEY5 ? '✅ Set' : '❌ Not set'}`);
    
    try {
        // Initialize the service
        const service = new YouTubeMp3ApiService();
        
        console.log('\n🔑 API Key Loading:');
        console.log(`Total keys loaded: ${service.apiKeys ? service.apiKeys.length : 'Unknown'}`);
        
        // Test video info (this will use the multi-key system)
        console.log('\n🎵 Testing Video Info (Multi-Key Fallback):');
        const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        
        try {
            const videoInfo = await service.getVideoInfo(testUrl);
            console.log('✅ Video info retrieved successfully:');
            console.log(`   Title: ${videoInfo.title}`);
            console.log(`   Duration: ${videoInfo.durationFormatted}`);
            console.log(`   Uploader: ${videoInfo.uploader}`);
        } catch (error) {
            console.log('❌ Video info failed:', error.message);
        }
        
        // Test conversion (this will use the multi-key system)
        console.log('\n🔄 Testing Conversion (Multi-Key Fallback):');
        
        try {
            const result = await service.convertToMp3(testUrl, '128k');
            if (result.success) {
                console.log('✅ Conversion successful:');
                console.log(`   Download URL: ${result.downloadUrl}`);
                console.log(`   Title: ${result.title}`);
                console.log(`   File Size: ${result.filesize} bytes`);
            } else {
                console.log('❌ Conversion failed:', result.error);
            }
        } catch (error) {
            console.log('❌ Conversion error:', error.message);
        }
        
    } catch (error) {
        console.log('❌ Service initialization failed:', error.message);
    }
    
    console.log('\n🎉 Multi-key fallback test completed!');
}

// Run the test
testMultiKeyFallback().catch(console.error);
