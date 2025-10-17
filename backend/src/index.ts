import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';

import conversionRoutes from './routes/conversion';
import healthRoutes from './routes/health';
import secureWalletRoutes from './routes/secureWallet';
import contactRoutes from './routes/contact';
import processAudioRoutes from './routes/processAudio';
import { conversionService } from './services/conversionService';
import { fallbackConversionService } from './services/fallbackConversionService';
import { cleanupExpiredJobs } from './controllers/processAudio';
import logger from './config/logger';
import { initializeDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? 'http://saveytb.com' : true),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Streaming-Request']
};

app.use(cors(corsOptions));

// Body parsing middleware with UTF-8 support
app.use(express.json({ 
  limit: '10mb',
  type: 'application/json'
}));
app.use(express.urlencoded({ 
  extended: true,
  limit: '10mb'
}));

// Set default charset for all responses
app.use((req, res, next) => {
  res.charset = 'utf-8';
  next();
});

// Request logging
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.path} - ${req.ip}`);
  next();
});

// Routes
app.use('/api', healthRoutes);
app.use('/api', conversionRoutes);
app.use('/api', contactRoutes);
app.use('/api', processAudioRoutes);
app.use('/api/secure-wallet', secureWalletRoutes);

// Debug: Log all registered routes
console.log('Routes registered: health, conversion, contact, processAudio');

// Error handling middleware
app.use((error: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const { getUserFriendlyError, logTechnicalError } = require('./utils/errorHandler');
  const userMessage = getUserFriendlyError(error);
  logTechnicalError(error, 'Express Error', req);
  
  res.status(500).json({
    success: false,
    message: userMessage
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint not found'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    logger.info('Starting server initialization...');
    logger.info(`Environment variables: NODE_ENV=${process.env.NODE_ENV}, DB_HOST=${process.env.DB_HOST}, PORT=${process.env.PORT}`);
    
    await initializeDatabase();
    logger.info('Database initialized successfully');
    
    // Check if yt-dlp is available
    const { spawn } = require('child_process');
    const checkYtDlp = () => {
      return new Promise((resolve) => {
        const ytdlp = spawn('yt-dlp', ['--version']);
        ytdlp.on('close', (code: number) => {
          resolve(code === 0);
        });
        ytdlp.on('error', () => {
          resolve(false);
        });
      });
    };

    const ytDlpAvailable = await checkYtDlp();
    const activeService = ytDlpAvailable ? conversionService : fallbackConversionService;
    
    if (ytDlpAvailable) {
      logger.info('✅ yt-dlp is available - using full conversion service');
    } else {
      logger.warn('⚠️ yt-dlp not available - using fallback service (mock processing)');
    }

    // Start cleanup cron job (every 10 minutes to clean expired files and jobs)
    cron.schedule('*/10 * * * *', () => {
      logger.info('Running cleanup job for expired files and jobs...');
      activeService.cleanupOldFiles().catch(error => {
        logger.error('Cleanup job failed:', error);
      });
    });
    logger.info('Cleanup cron job scheduled (every 10 minutes)');

    // Start audio processing cleanup cron job (every 5 minutes) - only for legacy processAudio
    cron.schedule('*/5 * * * *', () => {
      logger.info('Running legacy audio processing cleanup job...');
      cleanupExpiredJobs().catch(error => {
        logger.error('Legacy audio processing cleanup job failed:', error);
      });
    });
    logger.info('Legacy audio processing cleanup cron job scheduled (every 5 minutes)');

    // Start server
    const server = app.listen(PORT, '0.0.0.0', () => {
      logger.info(`✅ Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      // Use the same logic as database.ts to determine database type
      const useSQLite = process.env.NODE_ENV !== 'production' && !process.env.DB_HOST;
      logger.info(`Database: ${useSQLite ? 'SQLite' : 'PostgreSQL'}`);
      logger.info(`Cache: In-memory cache enabled`);
      logger.info('🚀 Backend is ready to accept connections!');
    });

    // Handle server errors
    server.on('error', (error: any) => {
      logger.error('Server error:', error);
      if (error.code === 'EADDRINUSE') {
        logger.error(`Port ${PORT} is already in use`);
      }
      process.exit(1);
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
