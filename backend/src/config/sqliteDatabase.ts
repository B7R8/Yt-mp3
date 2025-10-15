import sqlite3 from 'sqlite3';
import { promisify } from 'util';

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
    // Create conversions table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS conversions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT UNIQUE NOT NULL,
        title TEXT NOT NULL,
        duration INTEGER,
        file_size INTEGER,
        status TEXT DEFAULT 'pending',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        download_count INTEGER DEFAULT 0,
        last_downloaded_at DATETIME,
        file_path TEXT,
        thumbnail_url TEXT,
        channel_name TEXT,
        view_count INTEGER,
        like_count INTEGER,
        description TEXT
      )
    `);

    // Create blacklist table
    await dbRun(`
      CREATE TABLE IF NOT EXISTS blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        video_id TEXT UNIQUE NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('SQLite database initialized successfully');
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
    console.log('Executed query', { text, duration, rows: res.length });
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
    console.log('Executed query', { text, duration, rows: res ? 1 : 0 });
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
    console.log('Executed query', { text, duration, changes: res.changes });
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
