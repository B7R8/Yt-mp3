import express from 'express';
import { query } from '../config/database';

const router = express.Router();

// GET /api/health - Health check endpoint
router.get('/health', async (req, res) => {
  try {
    // Check database connection
    const result = await query('SELECT 1 as test');
    
    res.json({
      success: true,
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'connected',
        api: 'running'
      }
    });
  } catch (error) {
    res.status(503).json({
      success: false,
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      services: {
        database: 'disconnected',
        api: 'running'
      },
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;

