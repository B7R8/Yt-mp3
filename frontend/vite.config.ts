import path from 'path';
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
            target: 'http://localhost:3001',
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
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        // Disable source maps for production
        sourcemap: false,
        // Minify code aggressively
        minify: 'terser',
        // Target modern browsers for smaller bundles
        target: 'es2020',
        // Optimize CSS
        cssCodeSplit: true,
        // Remove console logs in production and optimize further
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
            pure_funcs: ['console.log', 'console.info', 'console.debug', 'console.warn', 'console.error', 'console.trace', 'console.table', 'console.group', 'console.groupEnd', 'console.dir', 'console.dirxml', 'console.assert', 'console.count', 'console.markTimeline', 'console.profile', 'console.profileEnd', 'console.time', 'console.timeEnd', 'console.timeStamp', 'console.timeline', 'console.timelineEnd'],
            passes: 5,
            unsafe: true,
            unsafe_comps: true,
            unsafe_math: true,
            unsafe_proto: true,
            unsafe_regexp: true,
            unsafe_arrows: true,
            unsafe_methods: true,
            side_effects: false,
            dead_code: true,
            conditionals: true,
            evaluate: true,
            booleans: true,
            loops: true,
            unused: true,
            hoist_funs: true,
            hoist_vars: true,
            if_return: true,
            join_vars: true,
            cascade: true,
            collapse_vars: true,
            reduce_vars: true,
            sequences: true,
            properties: true,
            comparisons: true,
            typeofs: true,
            global_defs: {
              'process.env.NODE_ENV': '"production"'
            }
          },
          mangle: {
            toplevel: true,
            eval: true,
            keep_fnames: false,
            reserved: ['gtag', 'dataLayer']
          },
          format: {
            comments: false,
            beautify: false,
            ascii_only: true
          }
        },
        // Optimize chunk splitting and tree shaking
        rollupOptions: {
          treeshake: {
            moduleSideEffects: false,
            propertyReadSideEffects: false,
            tryCatchDeoptimization: false,
          },
          output: {
            // Obfuscate chunk names with random strings
            chunkFileNames: 'assets/[hash:8].js',
            entryFileNames: 'assets/[hash:8].js',
            assetFileNames: 'assets/[hash:8].[ext]',
            // Remove comments and license files
            banner: '',
            footer: '',
            // Optimize manual chunks for better caching
            manualChunks: {
              vendor: ['react', 'react-dom'],
            },
            // Additional obfuscation
            format: 'iife',
            name: 'App',
            inlineDynamicImports: false,
            compact: true,
          },
        },
      },
    };
});
