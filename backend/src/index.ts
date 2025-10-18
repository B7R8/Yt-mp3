// Load environment variables FIRST, before any other imports
import dotenv from 'dotenv';
import path from 'path';
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cron from 'node-cron';

import simpleConversionRoutes from './routes/simpleConversion';
import healthRoutes from './routes/health';
import secureWalletRoutes from './routes/secureWallet';
import contactRoutes from './routes/contact';
import processAudioRoutes from './routes/processAudio';
import { SimpleConversionService } from './services/simpleConversionService';
import { cleanupExpiredJobs } from './controllers/processAudio';
import logger from './config/logger';
import { initializeDatabase } from './config/database';

const app = express();
app.set('trust proxy', 1);
const PORT = parseInt(process.env.PORT || '3001', 10);

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || (process.env.NODE_ENV === 'production' ? 'https://saveytb.com' : true),
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
app.use('/api', simpleConversionRoutes);
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
    
    // Start cleanup cron job (every 10 minutes to clean files older than 20 minutes)
    const conversionService = new SimpleConversionService();
    cron.schedule('*/10 * * * *', () => {
      logger.info('Running cleanup job for files older than 20 minutes...');
      conversionService.cleanupOldFiles().catch(error => {
        logger.error('Cleanup job failed:', error);
      });
    });
    logger.info('Cleanup cron job scheduled (every 10 minutes)');

    // Start audio processing cleanup cron job (every 5 minutes)
    cron.schedule('*/5 * * * *', () => {
      logger.info('Running audio processing cleanup job...');
      cleanupExpiredJobs().catch(error => {
        logger.error('Audio processing cleanup job failed:', error);
      });
    });
    logger.info('Audio processing cleanup cron job scheduled (every 5 minutes)');

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
