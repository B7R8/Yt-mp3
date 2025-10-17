import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import logger from './logger';

// SQLite database configuration for local development
const dbPath = process.env.SQLITE_DB_PATH || './conversions.db';

// Create SQLite database connection
const db = new sqlite3.Database(dbPath);

// Promisify database methods for async/await usage
const dbRun = promisify(db.run.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
const dbGet = promisify(db.get.bind(db)) as (sql: string, params?: any[]) => Promise<any>;
const dbAll = promisify(db.all.bind(db)) as (sql: string, params?: any[]) => Promise<any[]>;

// Initialize database tables
export async function initializeDatabase() {
  try {
    // Create conversions table with correct schema
    await dbRun(`
      CREATE TABLE IF NOT EXISTS conversions (
        id VARCHAR(255) PRIMARY KEY,
        youtube_url TEXT NOT NULL,
        video_title TEXT,
        status VARCHAR(50) NOT NULL DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        mp3_filename TEXT,
        error_message TEXT,
        quality_message TEXT,
        direct_download_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Create blacklist table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type VARCHAR(50) NOT NULL CHECK (type IN ('channel', 'url', 'video_id')),
        value TEXT NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'admin'
      )
    `);

    // Create main jobs table for conversion jobs
    await dbRun(`
      CREATE TABLE IF NOT EXISTS jobs (
        id TEXT PRIMARY KEY,
        video_id TEXT NOT NULL,
        youtube_url TEXT NOT NULL,
        video_title TEXT,
        user_id TEXT,
        status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
        quality TEXT DEFAULT '128k',
        trim_start REAL DEFAULT NULL,
        trim_duration REAL DEFAULT NULL,
        file_path TEXT,
        file_size INTEGER,
        duration REAL,
        ffmpeg_logs TEXT,
        error_message TEXT,
        download_url TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME DEFAULT (datetime('now', '+24 hours'))
      )
    `);

    // Create processed_files table for tracking server files
    await dbRun(`
      CREATE TABLE IF NOT EXISTS processed_files (
        id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        accessed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      )
    `);

    // Create user_requests table for tracking user activity
    await dbRun(`
      CREATE TABLE IF NOT EXISTS user_requests (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        ip_address TEXT,
        video_id TEXT,
        job_id TEXT,
        request_type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE SET NULL
      )
    `);

    // Create video_mutex table to prevent duplicate processing
    await dbRun(`
      CREATE TABLE IF NOT EXISTS video_mutex (
        video_id TEXT PRIMARY KEY,
        job_id TEXT NOT NULL,
        locked_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        expires_at DATETIME NOT NULL DEFAULT (datetime('now', '+30 minutes')),
        FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
      )
    `);

    // Create indexes for better performance
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_jobs_video_id ON jobs(video_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_jobs_expires_at ON jobs(expires_at)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_processed_files_job_id ON processed_files(job_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_processed_files_expires_at ON processed_files(expires_at)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_user_requests_user_id ON user_requests(user_id)`);
    await dbRun(`CREATE INDEX IF NOT EXISTS idx_video_mutex_expires_at ON video_mutex(expires_at)`);

    // Add direct_download_url column if it doesn't exist
    await ensureDirectDownloadUrlColumn();

    console.log('SQLite database initialized successfully');
  } catch (error) {
    console.error('SQLite database initialization error:', error);
    throw error;
  }
}

// Ensure direct_download_url column exists
export async function ensureDirectDownloadUrlColumn() {
  try {
    // Check if column already exists
    const tableInfo = await dbAll(`PRAGMA table_info(conversions)`);
    const hasColumn = tableInfo.some((col: any) => col.name === 'direct_download_url');
    
    if (!hasColumn) {
      await dbRun(`
        ALTER TABLE conversions 
        ADD COLUMN direct_download_url TEXT
      `);
      console.log('Added direct_download_url column to conversions table');
    } else {
      console.log('Column direct_download_url already exists');
    }
  } catch (error: any) {
    if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
      console.log('Column direct_download_url already exists');
    } else {
      console.log('Column might already exist:', error.message);
    }
  }
}

// Database query helper function
export async function query(text: string, params: unknown[] = []) {
  const start = Date.now();
  try {
    const res = await dbAll(text, params) as any[];
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Executed query', { text, duration, rows: res.length });
    }
    return { rows: res, rowCount: res.length };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Get single row
export async function getRow(text: string, params: unknown[] = []) {
  const start = Date.now();
  try {
    const res = await dbGet(text, params) as any;
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Executed query', { text, duration, rows: res ? 1 : 0 });
    }
    return { rows: res ? [res] : [], rowCount: res ? 1 : 0 };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Insert/Update/Delete operations
export async function runQuery(text: string, params: unknown[] = []) {
  const start = Date.now();
  try {
    const res = await dbRun(text, params) as any;
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Executed query', { text, duration, changes: res.changes });
    }
    return { rowCount: res.changes };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down SQLite database connection...');
  db.close();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down SQLite database connection...');
  db.close();
  process.exit(0);
});

// Initialize database on startup
initializeDatabase();

export default db;
