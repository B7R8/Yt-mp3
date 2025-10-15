import { Pool } from 'pg';

// Check if we should use SQLite for local development
const useSQLite = process.env.NODE_ENV === 'development' && !process.env.DB_HOST;

let db: any;
let sqliteQuery: any;
let getRow: any;
let runQuery: any;

if (useSQLite) {
  // Use SQLite for local development
  const sqliteDb = require('./sqliteDatabase');
  db = sqliteDb.default;
  sqliteQuery = sqliteDb.query;
  getRow = sqliteDb.getRow;
  runQuery = sqliteDb.runQuery;
} else {
  // Use PostgreSQL for production
  const dbConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME || 'ytmp3',
    user: process.env.DB_USER || 'ytmp3_user',
    password: process.env.DB_PASSWORD || 'ytmp3_secure_password_2024',
    max: 20, // Maximum number of clients in the pool
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds
    connectionTimeoutMillis: 2000, // Return an error after 2 seconds if connection could not be established
  };

  // Create PostgreSQL connection pool
  db = new Pool(dbConfig);
}

// Initialize database tables
export async function initializeDatabase() {
  if (useSQLite) {
    // SQLite initialization is handled in sqliteDatabase.ts
    console.log('SQLite database will be initialized automatically');
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
    console.log('Executed query', { text, duration, rows: res.rowCount });
    return res;
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

// Test connection on startup
testConnection();

export default db;

