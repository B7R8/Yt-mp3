const axios = require('axios');

const API_BASE = 'http://localhost:3001/api';

async function testAPI() {
  console.log('🧪 Testing YouTube-to-MP3 Converter API...\n');

  try {
    // Test 1: Check system stats
    console.log('1. Testing system stats...');
    const statsResponse = await axios.get(`${API_BASE}/stats`);
    console.log('✅ Stats:', statsResponse.data);
    console.log('');

    // Test 2: Check video info
    console.log('2. Testing video info...');
    const videoInfoResponse = await axios.get(`${API_BASE}/video-info?url=https://www.youtube.com/watch?v=dQw4w9WgXcQ`);
    console.log('✅ Video Info:', videoInfoResponse.data);
    console.log('');

    // Test 3: Create conversion job
    console.log('3. Testing conversion job creation...');
    const convertResponse = await axios.post(`${API_BASE}/convert`, {
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      quality: '128k'
    });
    console.log('✅ Conversion Job Created:', convertResponse.data);
    const jobId = convertResponse.data.jobId;
    console.log('');

    // Test 4: Check job status
    console.log('4. Testing job status...');
    let jobStatus;
    let attempts = 0;
    const maxAttempts = 10;

    while (attempts < maxAttempts) {
      const statusResponse = await axios.get(`${API_BASE}/status/${jobId}`);
      jobStatus = statusResponse.data;
      console.log(`   Attempt ${attempts + 1}: Status = ${jobStatus.status}`);
      
      if (jobStatus.status === 'completed' || jobStatus.status === 'failed') {
        break;
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds
      attempts++;
    }

    console.log('✅ Final Job Status:', jobStatus);
    console.log('');

    // Test 5: Download file (if completed)
    if (jobStatus.status === 'completed') {
      console.log('5. Testing file download...');
      try {
        const downloadResponse = await axios.get(`${API_BASE}/download/${jobId}`, {
          responseType: 'stream'
        });
        console.log('✅ Download successful! File size:', downloadResponse.headers['content-length']);
      } catch (error) {
        console.log('❌ Download failed:', error.response?.data || error.message);
      }
    } else {
      console.log('5. Skipping download test (job not completed)');
    }

    console.log('\n🎉 API testing completed!');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

// Run the test
testAPI();
