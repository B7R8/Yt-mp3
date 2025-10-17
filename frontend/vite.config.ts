import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    
    // Get all REACT_APP_* environment variables
    const reactAppEnv: Record<string, string> = {};
    Object.keys(env).forEach(key => {
      if (key.startsWith('REACT_APP_')) {
        reactAppEnv[`process.env.${key}`] = JSON.stringify(env[key]);
      }
    });
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          '/api': {
            target: process.env.NODE_ENV === 'production' ? 'http://backend:3001' : 'http://localhost:3001',
            changeOrigin: true,
            secure: false,
          },
        },
      },
      plugins: [react()],
      css: {
        postcss: './postcss.config.js',
      },
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        ...reactAppEnv
      },
      resolve: {
        alias: {
          '@': '/src',
        }
      },
      build: {
        // Disable source maps for production
        sourcemap: false,
        // Minify code
        minify: 'terser',
        // Target modern browsers
        target: 'es2020',
        // Optimize CSS
        cssCodeSplit: true,
        // Remove console logs in production
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug'],
            passes: 3,
            unsafe: true,
            unsafe_comps: true,
            unsafe_math: true,
            unsafe_proto: true,
            unsafe_regexp: true,
            unsafe_undefined: true,
          },
          format: {
            comments: false,
            ascii_only: true,
          },
          mangle: {
            safari10: true,
            properties: {
              regex: /^_/,
            },
          },
        },
        // Optimize chunk splitting
        rollupOptions: {
          output: {
            chunkFileNames: 'assets/[hash:8].js',
            entryFileNames: 'assets/[hash:8].js',
            assetFileNames: 'assets/[hash:8].[ext]',
            manualChunks: (id) => {
              // Vendor chunks
              if (id.includes('node_modules')) {
                if (id.includes('react') || id.includes('react-dom')) {
                  return 'react-vendor';
                }
                if (id.includes('@tanstack/react-query')) {
                  return 'query-vendor';
                }
                if (id.includes('swr')) {
                  return 'swr-vendor';
                }
                return 'vendor';
              }
              // Component chunks
              if (id.includes('/components/')) {
                return 'components';
              }
              // Page chunks
              if (id.includes('/pages/')) {
                return 'pages';
              }
            },
          },
        },
        // Enable compression
        reportCompressedSize: true,
        // Optimize for production
        assetsInlineLimit: 2048, // Reduced for better caching
        // Enable CSS minification
        cssMinify: true,
        // Optimize dependencies
        commonjsOptions: {
          include: [/node_modules/],
        },
      },
    };
});
