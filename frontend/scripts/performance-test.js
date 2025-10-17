const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

async function runPerformanceTest() {
  console.log('🚀 Starting performance test...');
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Set mobile viewport for mobile performance test
    await page.setViewport({ width: 375, height: 667, isMobile: true });
    
    // Enable performance metrics
    await page.setCacheEnabled(false);
    
    // Start performance measurement
    await page.goto('http://localhost:3000', { 
      waitUntil: 'networkidle0',
      timeout: 30000 
    });
    
    // Get performance metrics
    const metrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      const paint = performance.getEntriesByType('paint');
      
      return {
        // Core Web Vitals
        lcp: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        fid: 0, // First Input Delay - would need user interaction
        cls: 0, // Cumulative Layout Shift - would need more complex measurement
        
        // Other metrics
        fcp: paint.find(p => p.name === 'first-contentful-paint')?.startTime || 0,
        ttfb: navigation ? navigation.responseStart - navigation.fetchStart : 0,
        domContentLoaded: navigation ? navigation.domContentLoadedEventEnd - navigation.fetchStart : 0,
        loadComplete: navigation ? navigation.loadEventEnd - navigation.fetchStart : 0,
        
        // Resource metrics
        totalResources: performance.getEntriesByType('resource').length,
        totalSize: performance.getEntriesByType('resource').reduce((total, resource) => {
          return total + (resource.transferSize || 0);
        }, 0)
      };
    });
    
    // Calculate performance score
    const score = calculatePerformanceScore(metrics);
    
    console.log('📊 Performance Metrics:');
    console.log(`LCP (Largest Contentful Paint): ${metrics.lcp.toFixed(2)}ms`);
    console.log(`FCP (First Contentful Paint): ${metrics.fcp.toFixed(2)}ms`);
    console.log(`TTFB (Time to First Byte): ${metrics.ttfb.toFixed(2)}ms`);
    console.log(`DOM Content Loaded: ${metrics.domContentLoaded.toFixed(2)}ms`);
    console.log(`Load Complete: ${metrics.loadComplete.toFixed(2)}ms`);
    console.log(`Total Resources: ${metrics.totalResources}`);
    console.log(`Total Size: ${(metrics.totalSize / 1024).toFixed(2)} KB`);
    console.log(`Performance Score: ${score}/100`);
    
    // Performance recommendations
    console.log('\n💡 Performance Recommendations:');
    
    if (metrics.lcp > 2500) {
      console.log('⚠️ LCP is too high (>2.5s). Optimize images and critical resources.');
    }
    
    if (metrics.fcp > 1800) {
      console.log('⚠️ FCP is too high (>1.8s). Optimize critical CSS and fonts.');
    }
    
    if (metrics.ttfb > 200) {
      console.log('⚠️ TTFB is too high (>200ms). Optimize server response time.');
    }
    
    if (metrics.totalSize > 500 * 1024) {
      console.log('⚠️ Total size is large (>500KB). Consider code splitting.');
    }
    
    if (metrics.totalResources > 50) {
      console.log('⚠️ Too many resources (>50). Consider bundling and minification.');
    }
    
    if (score >= 95) {
      console.log('✅ Excellent performance! Your site is well optimized.');
    } else if (score >= 80) {
      console.log('👍 Good performance, but there\'s room for improvement.');
    } else {
      console.log('❌ Performance needs significant improvement.');
    }
    
    // Save results to file
    const results = {
      timestamp: new Date().toISOString(),
      metrics,
      score,
      recommendations: generateRecommendations(metrics)
    };
    
    fs.writeFileSync(
      path.join('dist', 'performance-results.json'), 
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n📄 Results saved to dist/performance-results.json');
    
  } catch (error) {
    console.error('❌ Performance test failed:', error.message);
  } finally {
    await browser.close();
  }
}

function calculatePerformanceScore(metrics) {
  let score = 100;
  
  // LCP scoring (40% weight)
  if (metrics.lcp > 4000) score -= 40;
  else if (metrics.lcp > 2500) score -= 30;
  else if (metrics.lcp > 1800) score -= 20;
  else if (metrics.lcp > 1200) score -= 10;
  
  // FCP scoring (20% weight)
  if (metrics.fcp > 3000) score -= 20;
  else if (metrics.fcp > 1800) score -= 15;
  else if (metrics.fcp > 1200) score -= 10;
  else if (metrics.fcp > 800) score -= 5;
  
  // TTFB scoring (20% weight)
  if (metrics.ttfb > 600) score -= 20;
  else if (metrics.ttfb > 400) score -= 15;
  else if (metrics.ttfb > 200) score -= 10;
  else if (metrics.ttfb > 100) score -= 5;
  
  // Size scoring (10% weight)
  if (metrics.totalSize > 1000 * 1024) score -= 10;
  else if (metrics.totalSize > 500 * 1024) score -= 7;
  else if (metrics.totalSize > 250 * 1024) score -= 5;
  else if (metrics.totalSize > 100 * 1024) score -= 2;
  
  // Resources scoring (10% weight)
  if (metrics.totalResources > 100) score -= 10;
  else if (metrics.totalResources > 50) score -= 7;
  else if (metrics.totalResources > 25) score -= 5;
  else if (metrics.totalResources > 10) score -= 2;
  
  return Math.max(0, Math.min(100, score));
}

function generateRecommendations(metrics) {
  const recommendations = [];
  
  if (metrics.lcp > 2500) {
    recommendations.push('Optimize Largest Contentful Paint by reducing image sizes and using WebP format');
  }
  
  if (metrics.fcp > 1800) {
    recommendations.push('Improve First Contentful Paint by inlining critical CSS and optimizing fonts');
  }
  
  if (metrics.ttfb > 200) {
    recommendations.push('Reduce Time to First Byte by optimizing server response time and using a CDN');
  }
  
  if (metrics.totalSize > 500 * 1024) {
    recommendations.push('Reduce bundle size through code splitting and tree shaking');
  }
  
  if (metrics.totalResources > 50) {
    recommendations.push('Reduce number of HTTP requests by bundling and minifying resources');
  }
  
  return recommendations;
}

// Run the test
runPerformanceTest().catch(console.error);
