import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

// Create SQLite database connection
const dbPath = path.join(process.cwd(), 'conversions.db');

export const db = open({
  filename: dbPath,
  driver: sqlite3.Database
});

// Initialize database tables
export async function initializeDatabase() {
  const database = await db;
  
  await database.exec(`
    CREATE TABLE IF NOT EXISTS conversions (
      id TEXT PRIMARY KEY,
      youtube_url TEXT NOT NULL,
      video_title TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      mp3_filename TEXT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  console.log('SQLite database initialized');
}

// Test database connection
db.then(() => {
  console.log('Connected to SQLite database');
  initializeDatabase();
}).catch((err) => {
  console.error('Database connection error:', err);
  process.exit(-1);
});

export default db;

