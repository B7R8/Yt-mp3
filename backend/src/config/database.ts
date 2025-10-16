import { Pool } from 'pg';
import logger from './logger';

// Use SQLite for local development
const useSQLite = true; // Use SQLite for local development

let db: any;
let sqliteQuery: any;
let getRow: any;
let runQuery: any;

if (useSQLite) {
  // Use SQLite for local development
  try {
    const sqliteDb = require('./sqliteDatabase');
    db = sqliteDb.default;
    sqliteQuery = sqliteDb.query;
    getRow = sqliteDb.getRow;
    runQuery = sqliteDb.runQuery;
  } catch (error) {
    console.log('SQLite not available, using PostgreSQL instead');
    // Fallback to PostgreSQL
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '5432'),
      database: process.env.DB_NAME || 'youtube_converter',
      user: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    };
    db = new Pool(dbConfig);
  }
} else {
  // Use PostgreSQL for production
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'youtube_converter',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    max: parseInt(process.env.DB_MAX_CONNECTIONS || '20'), // Maximum number of clients in the pool
    min: parseInt(process.env.DB_MIN_CONNECTIONS || '2'), // Minimum number of clients in the pool
    idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'), // Close idle clients after 30 seconds
    connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'), // Return an error after 2 seconds if connection could not be established
    acquireTimeoutMillis: parseInt(process.env.DB_ACQUIRE_TIMEOUT || '60000'), // Maximum time to wait for a connection
    allowExitOnIdle: true, // Allow the pool to close all connections and exit when idle
    statement_timeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '30000'), // Statement timeout in milliseconds
    query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'), // Query timeout in milliseconds
  };

  // Create PostgreSQL connection pool
  db = new Pool(dbConfig);
}

// Initialize database tables
export async function initializeDatabase() {
  if (useSQLite) {
    // SQLite initialization is handled in sqliteDatabase.ts
    console.log('SQLite database will be initialized automatically');
    await ensureDirectDownloadUrlColumn();
    return;
  }

  try {
    // Test PostgreSQL database connection
    const client = await db.connect();
    
    // Check if tables exist, if not, they will be created by the init.sql script
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('conversions', 'blacklist')
    `);
    
    client.release();
    
    if (result.rows.length === 2) {
      console.log('PostgreSQL database tables already exist');
    } else {
      console.log('PostgreSQL database tables will be created by init.sql');
    }
    
    console.log('PostgreSQL database initialized successfully');
  } catch (error) {
    console.error('Database initialization error:', error);
    throw error;
  }
}

// Test database connection and initialize
async function testConnection() {
  if (useSQLite) {
    console.log('Using SQLite database for local development');
    await initializeDatabase();
    return;
  }

  try {
    const client = await db.connect();
    console.log('Connected to PostgreSQL database');
    client.release();
    
    // Initialize database after successful connection
    await initializeDatabase();
  } catch (error) {
    console.error('PostgreSQL database connection error:', error);
    process.exit(-1);
  }
}

// Handle database errors (only for PostgreSQL)
if (!useSQLite) {
  db.on('error', (err: Error) => {
    console.error('PostgreSQL database error:', err);
    process.exit(-1);
  });
}

// Database query helper function
export async function query(text: string, params?: unknown[]) {
  if (useSQLite) {
    return await sqliteQuery(text, params || []);
  }

  const start = Date.now();
  try {
    const res = await db.query(text, params);
    const duration = Date.now() - start;
    if (process.env.LOG_LEVEL === 'debug') {
      logger.debug('Executed query', { text, duration, rows: res.rowCount });
    }
    // Ensure consistent return format for both SQLite and PostgreSQL
    return {
      rows: res.rows,
      rowCount: res.rowCount
    };
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down database connection...');
  if (!useSQLite) {
    await db.end();
  } else {
    db.close();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down database connection...');
  if (!useSQLite) {
    await db.end();
  } else {
    db.close();
  }
  process.exit(0);
});

// Ensure direct_download_url column exists for SQLite
export async function ensureDirectDownloadUrlColumn() {
  if (!useSQLite) return;
  
  try {
    await sqliteQuery(`
      ALTER TABLE conversions 
      ADD COLUMN direct_download_url TEXT;
    `);
    console.log('🗃️ Database schema updated successfully (direct_download_url added)');
  } catch (error: any) {
    if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
      console.log('Column direct_download_url already exists');
    } else {
      console.log('Column might already exist:', error.message);
    }
  }
}

// Test connection on startup
testConnection();

export default db;

