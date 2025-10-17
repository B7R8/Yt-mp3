const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting optimized build process...');

// Set production environment
process.env.NODE_ENV = 'production';

try {
  // Clean previous build
  console.log('🧹 Cleaning previous build...');
  if (fs.existsSync('dist')) {
    fs.rmSync('dist', { recursive: true, force: true });
  }

  // Install dependencies if needed
  console.log('📦 Installing dependencies...');
  execSync('npm ci --only=production', { stdio: 'inherit' });

  // Build with Vite
  console.log('🔨 Building with Vite...');
  execSync('npm run build', { stdio: 'inherit' });

  // Optimize images (if imagemagick is available)
  console.log('🖼️ Optimizing images...');
  try {
    const imagesDir = path.join('dist');
    const images = fs.readdirSync(imagesDir).filter(file => 
      file.match(/\.(png|jpg|jpeg|gif)$/i)
    );
    
    images.forEach(image => {
      const inputPath = path.join(imagesDir, image);
      const outputPath = path.join(imagesDir, image.replace(/\.(png|jpg|jpeg|gif)$/i, '.webp'));
      
      try {
        execSync(`magick "${inputPath}" -quality 85 -define webp:lossless=false "${outputPath}"`, { stdio: 'pipe' });
        console.log(`✅ Converted ${image} to WebP`);
        
        // Remove original if WebP is smaller
        const originalSize = fs.statSync(inputPath).size;
        const webpSize = fs.statSync(outputPath).size;
        
        if (webpSize < originalSize) {
          fs.unlinkSync(inputPath);
          console.log(`🗑️ Removed original ${image} (WebP is smaller)`);
        } else {
          fs.unlinkSync(outputPath);
          console.log(`📄 Kept original ${image} (smaller than WebP)`);
        }
      } catch (error) {
        console.log(`⚠️ Could not convert ${image} to WebP (ImageMagick not available)`);
      }
    });
  } catch (error) {
    console.log('⚠️ Image optimization skipped (ImageMagick not available)');
  }

  // Generate sitemap
  console.log('🗺️ Generating sitemap...');
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://saveytb.com/</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://saveytb.com/faqs</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://saveytb.com/contact</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>
  <url>
    <loc>https://saveytb.com/privacy</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
  <url>
    <loc>https://saveytb.com/terms</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.5</priority>
  </url>
</urlset>`;

  fs.writeFileSync(path.join('dist', 'sitemap.xml'), sitemap);

  // Generate robots.txt
  console.log('🤖 Generating robots.txt...');
  const robots = `User-agent: *
Allow: /

Sitemap: https://saveytb.com/sitemap.xml

# Block access to sensitive areas
Disallow: /api/
Disallow: /admin/
Disallow: /private/
Disallow: /*.json$
Disallow: /*.map$
Disallow: /node_modules/
Disallow: /src/
Disallow: /.git/
Disallow: /.env
Disallow: /package.json
Disallow: /tsconfig.json
Disallow: /vite.config.ts`;

  fs.writeFileSync(path.join('dist', 'robots.txt'), robots);

  // Analyze bundle size
  console.log('📊 Analyzing bundle size...');
  try {
    const distDir = path.join('dist', 'assets');
    if (fs.existsSync(distDir)) {
      const files = fs.readdirSync(distDir);
      let totalSize = 0;
      
      files.forEach(file => {
        const filePath = path.join(distDir, file);
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
        console.log(`📄 ${file}: ${(stats.size / 1024).toFixed(2)} KB`);
      });
      
      console.log(`📦 Total bundle size: ${(totalSize / 1024).toFixed(2)} KB`);
      
      if (totalSize > 500 * 1024) {
        console.log('⚠️ Bundle size is large (>500KB). Consider code splitting.');
      } else {
        console.log('✅ Bundle size is optimized!');
      }
    }
  } catch (error) {
    console.log('⚠️ Could not analyze bundle size');
  }

  console.log('✅ Optimized build completed successfully!');
  console.log('🚀 Ready for deployment!');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}
