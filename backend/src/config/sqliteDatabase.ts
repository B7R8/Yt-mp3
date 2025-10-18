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
    // Create videos table for RapidAPI-only system
    await dbRun(`
      CREATE TABLE IF NOT EXISTS videos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT UNIQUE NOT NULL,
        title TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        progress INTEGER DEFAULT 0,
        download_url TEXT,
        requested_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        completed_at DATETIME NULL,
        error_message TEXT,
        quality TEXT DEFAULT '128k',
        file_size INTEGER DEFAULT 0,
        duration INTEGER DEFAULT 0,
        user_ip TEXT,
        expires_at DATETIME,
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

    console.log('SQLite database initialized successfully with RapidAPI schema');
  } catch (error) {
    console.error('SQLite database initialization error:', error);
    throw error;
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
