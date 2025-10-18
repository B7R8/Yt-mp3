#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧹 Cleaning development environment...');

try {
  // Clear node_modules cache
  console.log('📦 Clearing node_modules...');
  if (fs.existsSync('node_modules')) {
    execSync('rm -rf node_modules', { stdio: 'inherit' });
  }

  // Clear package-lock.json
  if (fs.existsSync('package-lock.json')) {
    console.log('🔒 Removing package-lock.json...');
    fs.unlinkSync('package-lock.json');
  }

  // Clear dist directory
  if (fs.existsSync('dist')) {
    console.log('🗑️  Clearing dist directory...');
    execSync('rm -rf dist', { stdio: 'inherit' });
  }

  // Clear Vite cache
  if (fs.existsSync('.vite')) {
    console.log('⚡ Clearing Vite cache...');
    execSync('rm -rf .vite', { stdio: 'inherit' });
  }

  // Clear browser cache (if on macOS)
  if (process.platform === 'darwin') {
    console.log('🌐 Clearing browser cache...');
    try {
      execSync('rm -rf ~/Library/Caches/Google/Chrome/Default/Cache', { stdio: 'ignore' });
      execSync('rm -rf ~/Library/Caches/com.apple.Safari', { stdio: 'ignore' });
    } catch (e) {
      // Ignore errors
    }
  }

  console.log('✅ Cleanup complete!');
  console.log('🚀 Run "npm install" to reinstall dependencies');
  console.log('🎯 Then run "npm run dev" to start development server');

} catch (error) {
  console.error('❌ Error during cleanup:', error.message);
  process.exit(1);
}

