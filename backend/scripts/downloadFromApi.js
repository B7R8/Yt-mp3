#!/usr/bin/env node

const https = require('https');
const fs = require('fs');
const path = require('path');

/**
 * Download file from API URL to server downloads directory
 * This runs outside the Docker container to avoid network issues
 */
async function downloadFromApi(downloadUrl, filename) {
  return new Promise((resolve, reject) => {
    const downloadsDir = '/var/Yt-mp3/downloads';
    const filePath = path.join(downloadsDir, filename);
    
    console.log(`📥 Downloading from: ${downloadUrl}`);
    console.log(`📁 Saving to: ${filePath}`);
    
    // Ensure downloads directory exists
    if (!fs.existsSync(downloadsDir)) {
      fs.mkdirSync(downloadsDir, { recursive: true });
    }
    
    const file = fs.createWriteStream(filePath);
    
    const request = https.get(downloadUrl, (response) => {
      if (response.statusCode === 200) {
        let downloadedBytes = 0;
        
        response.on('data', (chunk) => {
          downloadedBytes += chunk.length;
        });
        
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`✅ File downloaded successfully: ${filePath} (${downloadedBytes} bytes)`);
          resolve({
            success: true,
            filePath: filePath,
            size: downloadedBytes
          });
        });
        
        file.on('error', (error) => {
          console.error(`❌ File write error: ${error.message}`);
          fs.unlink(filePath).catch(() => {}); // Clean up on error
          reject(error);
        });
      } else if (response.statusCode === 404) {
        console.error(`❌ Download URL expired (404): ${downloadUrl}`);
        reject(new Error('Download URL has expired'));
      } else {
        console.error(`❌ Download failed with status: ${response.statusCode}`);
        reject(new Error(`Download failed with status: ${response.statusCode}`));
      }
    });
    
    request.on('error', (error) => {
      console.error(`❌ Download request error: ${error.message}`);
      reject(error);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

// If called directly from command line
if (require.main === module) {
  const downloadUrl = process.argv[2];
  const filename = process.argv[3];
  
  if (!downloadUrl || !filename) {
    console.error('Usage: node downloadFromApi.js <downloadUrl> <filename>');
    process.exit(1);
  }
  
  downloadFromApi(downloadUrl, filename)
    .then(result => {
      console.log('Download completed:', result);
      process.exit(0);
    })
    .catch(error => {
      console.error('Download failed:', error.message);
      process.exit(1);
    });
}

module.exports = { downloadFromApi };
