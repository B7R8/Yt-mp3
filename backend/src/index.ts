import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import cron from 'node-cron';

import conversionRoutes from './routes/conversion';
import healthRoutes from './routes/health';
import adminRoutes from './routes/admin';
import secureWalletRoutes from './routes/secureWallet';
import { ConversionService } from './services/conversionService';
import logger from './config/logger';
import { initializeDatabase } from './config/database';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration - More permissive for debugging
app.use(cors({
  origin: true, // Allow all origins for debugging
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept', 'Cache-Control', 'X-Streaming-Request']
}));

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
app.use('/api/secure-wallet', secureWalletRoutes);
app.use('/api', adminRoutes);

// Debug: Log all registered routes
console.log('Routes registered: health, conversion, admin');

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
    await initializeDatabase();
    
    // Start cleanup cron job
    const conversionService = new ConversionService();
    cron.schedule('0 */1 * * *', () => {
      logger.info('Running cleanup job...');
      conversionService.cleanupOldFiles().catch(error => {
        logger.error('Cleanup job failed:', error);
      });
    });

    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info('Using SQLite database for development');
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
