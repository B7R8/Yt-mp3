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
        // Minify code
        minify: 'terser',
        // Remove console logs in production
        terserOptions: {
          compress: {
            drop_console: true,
            drop_debugger: true,
          },
        },
        // Optimize chunk splitting
        rollupOptions: {
          output: {
            // Obfuscate chunk names
            chunkFileNames: 'assets/[hash].js',
            entryFileNames: 'assets/[hash].js',
            assetFileNames: 'assets/[hash].[ext]',
            // Remove comments and license files
            banner: '',
            footer: '',
          },
        },
      },
    };
});
