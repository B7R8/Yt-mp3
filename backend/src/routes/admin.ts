import express, { Request, Response } from 'express';
import { db } from '../config/database';
import logger from '../config/logger';
import { promises as fs } from 'fs';
import path from 'path';

const router = express.Router();

// Debug: Log when admin routes are loaded
console.log('Admin routes loaded successfully');

// Basic admin authentication middleware
const adminAuth = (req: Request, res: Response, next: any) => {
  const adminKey = req.headers['x-admin-key'] as string;
  const expectedKey = process.env.ADMIN_KEY || 'admin1234'; // Change this in production!
  
  // Debug logging
  console.log('Admin auth attempt:', {
    providedKey: adminKey ? '***' : 'undefined',
    expectedKey: expectedKey ? '***' : 'undefined',
    hasKey: !!adminKey,
    hasExpected: !!expectedKey
  });
  
  if (!adminKey) {
    return res.status(401).json({ success: false, message: 'Admin key required' });
  }
  
  if (adminKey === expectedKey) {
    next();
  } else {
    res.status(401).json({ success: false, message: 'Invalid admin key' });
  }
};

// Apply admin auth to all routes
router.use(adminAuth);

// Test endpoint with auth
router.get('/admin/test', (req: Request, res: Response) => {
  console.log('Admin test endpoint hit');
  res.json({ 
    success: true, 
    message: 'Admin routes are working',
    expectedKey: process.env.ADMIN_KEY || 'admin123',
    hasEnvKey: !!process.env.ADMIN_KEY
  });
});

// GET /api/admin/dashboard - Get dashboard statistics
router.get('/admin/dashboard', async (req: Request, res: Response) => {
  try {
    const database = await db;
    
    // Get total conversions
    const totalConversions = await database.get(
      'SELECT COUNT(*) as count FROM conversions'
    );
    
    // Get conversions by status
    const statusStats = await database.all(
      'SELECT status, COUNT(*) as count FROM conversions GROUP BY status'
    );
    
    // Get conversions from last 24 hours
    const last24Hours = await database.get(
      `SELECT COUNT(*) as count FROM conversions 
       WHERE created_at >= datetime('now', '-1 day')`
    );
    
    // Get conversions from last 7 days
    const last7Days = await database.get(
      `SELECT COUNT(*) as count FROM conversions 
       WHERE created_at >= datetime('now', '-7 days')`
    );
    
    // Get most popular video titles (top 10)
    const popularVideos = await database.all(
      `SELECT video_title, COUNT(*) as count 
       FROM conversions 
       WHERE video_title IS NOT NULL AND video_title != 'Unknown Video'
       GROUP BY video_title 
       ORDER BY count DESC 
       LIMIT 10`
    );
    
    // Get quality preferences
    const qualityStats = await database.all(
      `SELECT quality_message, COUNT(*) as count 
       FROM conversions 
       WHERE quality_message IS NOT NULL
       GROUP BY quality_message`
    );
    
    // Get hourly distribution for today
    const hourlyStats = await database.all(
      `SELECT strftime('%H', created_at) as hour, COUNT(*) as count 
       FROM conversions 
       WHERE date(created_at) = date('now')
       GROUP BY hour 
       ORDER BY hour`
    );
    
    // Get system info
    const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    let diskUsage = 0;
    let fileCount = 0;
    
    try {
      const files = await fs.readdir(downloadsDir);
      fileCount = files.length;
      
      for (const file of files) {
        const filePath = path.join(downloadsDir, file);
        const stats = await fs.stat(filePath);
        diskUsage += stats.size;
      }
    } catch (error) {
      logger.warn('Could not read downloads directory:', error);
    }
    
    res.json({
      success: true,
      data: {
        totalConversions: totalConversions?.count || 0,
        last24Hours: last24Hours?.count || 0,
        last7Days: last7Days?.count || 0,
        statusStats: statusStats.reduce((acc: any, row: any) => {
          acc[row.status] = row.count;
          return acc;
        }, {}),
        popularVideos,
        qualityStats,
        hourlyStats: hourlyStats.reduce((acc: any, row: any) => {
          acc[row.hour] = row.count;
          return acc;
        }, {}),
        systemInfo: {
          diskUsage: Math.round(diskUsage / 1024 / 1024), // MB
          fileCount,
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform
        }
      }
    });
  } catch (error) {
    logger.error('Admin dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard data' });
  }
});

// GET /api/admin/jobs - Get recent jobs with pagination
router.get('/admin/jobs', async (req: Request, res: Response) => {
  try {
    const database = await db;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as string;
    const search = req.query.search as string;
    
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params: any[] = [];
    
    if (status) {
      whereClause += ' WHERE status = ?';
      params.push(status);
    }
    
    if (search) {
      const searchCondition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${searchCondition} (video_title LIKE ? OR youtube_url LIKE ? OR id LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }
    
    // Get jobs
    const jobs = await database.all(
      `SELECT * FROM conversions 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Get total count
    const totalResult = await database.get(
      `SELECT COUNT(*) as count FROM conversions ${whereClause}`,
      params
    );
    
    res.json({
      success: true,
      data: {
        jobs,
        pagination: {
          page,
          limit,
          total: totalResult?.count || 0,
          pages: Math.ceil((totalResult?.count || 0) / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Admin jobs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch jobs' });
  }
});

// GET /api/admin/job/:id - Get specific job details
router.get('/admin/job/:id', async (req: Request, res: Response) => {
  try {
    const database = await db;
    const job = await database.get(
      'SELECT * FROM conversions WHERE id = ?',
      [req.params.id]
    );
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    // Check if file exists
    const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    let fileExists = false;
    let fileSize = 0;
    
    if (job.mp3_filename) {
      try {
        const filePath = path.join(downloadsDir, job.mp3_filename);
        const stats = await fs.stat(filePath);
        fileExists = true;
        fileSize = stats.size;
      } catch (error) {
        // File doesn't exist
      }
    }
    
    res.json({
      success: true,
      data: {
        ...job,
        fileExists,
        fileSize: Math.round(fileSize / 1024 / 1024) // MB
      }
    });
  } catch (error) {
    logger.error('Admin job details error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch job details' });
  }
});

// POST /api/admin/cleanup - Manual cleanup of old files
router.post('/admin/cleanup', async (req: Request, res: Response) => {
  try {
    const database = await db;
    const maxAgeHours = parseInt(req.body.maxAgeHours) || 1;
    const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
    const cutoffTime = new Date(Date.now() - maxAgeMs);
    
    const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    
    // Get old completed jobs
    const result = await database.all(
      `SELECT id, mp3_filename FROM conversions 
       WHERE status = 'completed' AND created_at < ?`,
      [cutoffTime.toISOString()]
    );
    
    let deletedFiles = 0;
    let deletedSize = 0;
    
    for (const row of result) {
      if (row.mp3_filename) {
        const filePath = path.join(downloadsDir, row.mp3_filename);
        
        try {
          const stats = await fs.stat(filePath);
          await fs.unlink(filePath);
          deletedFiles++;
          deletedSize += stats.size;
          logger.info(`Admin cleanup: Deleted file ${filePath}`);
        } catch (error) {
          logger.warn(`Admin cleanup: Failed to delete file ${filePath}:`, error);
        }
      }
      
      // Mark job as cleaned up
      await database.run(
        'UPDATE conversions SET status = ? WHERE id = ?',
        ['cleaned', row.id]
      );
    }
    
    res.json({
      success: true,
      message: `Cleanup completed. Deleted ${deletedFiles} files (${Math.round(deletedSize / 1024 / 1024)} MB)`,
      data: {
        deletedFiles,
        deletedSize: Math.round(deletedSize / 1024 / 1024) // MB
      }
    });
  } catch (error) {
    logger.error('Admin cleanup error:', error);
    res.status(500).json({ success: false, message: 'Failed to cleanup files' });
  }
});

// DELETE /api/admin/job/:id - Delete specific job and file
router.delete('/admin/job/:id', async (req: Request, res: Response) => {
  try {
    const database = await db;
    const job = await database.get(
      'SELECT * FROM conversions WHERE id = ?',
      [req.params.id]
    );
    
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }
    
    // Delete file if exists
    const downloadsDir = process.env.DOWNLOADS_DIR || './downloads';
    let fileDeleted = false;
    
    if (job.mp3_filename) {
      try {
        const filePath = path.join(downloadsDir, job.mp3_filename);
        await fs.unlink(filePath);
        fileDeleted = true;
        logger.info(`Admin delete: Deleted file ${filePath}`);
      } catch (error) {
        logger.warn(`Admin delete: Failed to delete file:`, error);
      }
    }
    
    // Delete job from database
    await database.run('DELETE FROM conversions WHERE id = ?', [req.params.id]);
    
    res.json({
      success: true,
      message: 'Job deleted successfully',
      data: { fileDeleted }
    });
  } catch (error) {
    logger.error('Admin delete job error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete job' });
  }
});

// GET /api/admin/logs - Get recent log entries
router.get('/admin/logs', async (req: Request, res: Response) => {
  try {
    const logFile = path.join(process.cwd(), 'logs', 'combined.log');
    
    try {
      const logContent = await fs.readFile(logFile, 'utf-8');
      const lines = logContent.split('\n').filter(line => line.trim());
      
      // Get last 100 lines
      const recentLines = lines.slice(-100).reverse();
      
      res.json({
        success: true,
        data: { logs: recentLines }
      });
    } catch (error) {
      res.json({
        success: true,
        data: { logs: ['No log file found'] }
      });
    }
  } catch (error) {
    logger.error('Admin logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

// GET /api/admin/blacklist - Get blacklist entries
router.get('/admin/blacklist', async (req: Request, res: Response) => {
  try {
    const database = await db;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const type = req.query.type as string;
    const search = req.query.search as string;
    
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params: any[] = [];
    
    if (type) {
      whereClause += ' WHERE type = ?';
      params.push(type);
    }
    
    if (search) {
      const searchCondition = whereClause ? ' AND' : ' WHERE';
      whereClause += `${searchCondition} (value LIKE ? OR reason LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }
    
    // Get blacklist entries
    const entries = await database.all(
      `SELECT * FROM blacklist 
       ${whereClause}
       ORDER BY created_at DESC 
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );
    
    // Get total count
    const totalResult = await database.get(
      `SELECT COUNT(*) as count FROM blacklist ${whereClause}`,
      params
    );
    
    res.json({
      success: true,
      data: {
        entries,
        pagination: {
          page,
          limit,
          total: totalResult?.count || 0,
          pages: Math.ceil((totalResult?.count || 0) / limit)
        }
      }
    });
  } catch (error) {
    logger.error('Admin blacklist error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch blacklist' });
  }
});

// POST /api/admin/blacklist - Add blacklist entry
router.post('/admin/blacklist', async (req: Request, res: Response) => {
  try {
    const database = await db;
    const { type, value, reason } = req.body;
    
    if (!type || !value) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type and value are required' 
      });
    }
    
    if (!['channel', 'url', 'video_id'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type must be channel, url, or video_id' 
      });
    }
    
    // Check if entry already exists
    const existing = await database.get(
      'SELECT id FROM blacklist WHERE type = ? AND value = ?',
      [type, value]
    );
    
    if (existing) {
      return res.status(400).json({ 
        success: false, 
        message: 'Entry already exists in blacklist' 
      });
    }
    
    // Add to blacklist
    const result = await database.run(
      'INSERT INTO blacklist (type, value, reason, created_by) VALUES (?, ?, ?, ?)',
      [type, value, reason || null, 'admin']
    );
    
    res.json({
      success: true,
      message: 'Entry added to blacklist successfully',
      data: { id: result.lastID }
    });
  } catch (error) {
    logger.error('Admin add blacklist error:', error);
    res.status(500).json({ success: false, message: 'Failed to add blacklist entry' });
  }
});

// DELETE /api/admin/blacklist/:id - Remove blacklist entry
router.delete('/admin/blacklist/:id', async (req: Request, res: Response) => {
  try {
    const database = await db;
    const id = parseInt(req.params.id);
    
    if (isNaN(id)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid blacklist entry ID' 
      });
    }
    
    const result = await database.run(
      'DELETE FROM blacklist WHERE id = ?',
      [id]
    );
    
    if (result.changes === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Blacklist entry not found' 
      });
    }
    
    res.json({
      success: true,
      message: 'Blacklist entry removed successfully'
    });
  } catch (error) {
    logger.error('Admin delete blacklist error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove blacklist entry' });
  }
});

export default router;
