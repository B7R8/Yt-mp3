"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.query = query;
exports.queryWithParams = queryWithParams;
exports.ensureDirectDownloadUrlColumn = ensureDirectDownloadUrlColumn;
exports.ensureQualityColumns = ensureQualityColumns;
const pg_1 = require("pg");
const logger_1 = __importDefault(require("./logger"));
// Use SQLite for local development, PostgreSQL for production
const useSQLite = process.env.NODE_ENV !== 'production';
let db;
let sqliteQuery;
let getRow;
let runQuery;
if (useSQLite) {
    // Use SQLite for local development
    try {
        const sqliteDb = require('./sqliteDatabase');
        db = sqliteDb.default;
        sqliteQuery = sqliteDb.query;
        getRow = sqliteDb.getRow;
        runQuery = sqliteDb.runQuery;
    }
    catch (error) {
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
        db = new pg_1.Pool(dbConfig);
    }
}
else {
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
    db = new pg_1.Pool(dbConfig);
}
// Initialize database tables
async function initializeDatabase() {
    if (useSQLite) {
        // SQLite initialization is handled in sqliteDatabase.ts
        console.log('SQLite database will be initialized automatically');
        await ensureDirectDownloadUrlColumn();
        await ensureQualityColumns();
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
        }
        else {
            console.log('PostgreSQL database tables will be created by init.sql');
        }
        // Ensure quality columns exist
        await ensureQualityColumns();
        console.log('PostgreSQL database initialized successfully');
    }
    catch (error) {
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
    }
    catch (error) {
        console.error('PostgreSQL database connection error:', error);
        process.exit(-1);
    }
}
// Handle database errors (only for PostgreSQL)
if (!useSQLite) {
    db.on('error', (err) => {
        console.error('PostgreSQL database error:', err);
        process.exit(-1);
    });
}
// Database query helper function
async function query(text, params) {
    if (useSQLite) {
        return await sqliteQuery(text, params || []);
    }
    const start = Date.now();
    try {
        const res = await db.query(text, params);
        const duration = Date.now() - start;
        if (process.env.LOG_LEVEL === 'debug') {
            logger_1.default.debug('Executed query', { text, duration, rows: res.rowCount });
        }
        // Ensure consistent return format for both SQLite and PostgreSQL
        return {
            rows: res.rows,
            rowCount: res.rowCount
        };
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
// Database-agnostic query function that handles parameter placeholders
async function queryWithParams(text, params) {
    if (useSQLite) {
        // Convert PostgreSQL placeholders ($1, $2, etc.) to SQLite placeholders (?)
        const sqliteText = text.replace(/\$(\d+)/g, '?');
        return await sqliteQuery(sqliteText, params || []);
    }
    const start = Date.now();
    try {
        const res = await db.query(text, params);
        const duration = Date.now() - start;
        if (process.env.LOG_LEVEL === 'debug') {
            logger_1.default.debug('Executed query', { text, duration, rows: res.rowCount });
        }
        return {
            rows: res.rows,
            rowCount: res.rowCount
        };
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('Shutting down database connection...');
    if (!useSQLite) {
        await db.end();
    }
    else {
        db.close();
    }
    process.exit(0);
});
process.on('SIGTERM', async () => {
    console.log('Shutting down database connection...');
    if (!useSQLite) {
        await db.end();
    }
    else {
        db.close();
    }
    process.exit(0);
});
// Ensure direct_download_url column exists for SQLite
async function ensureDirectDownloadUrlColumn() {
    if (!useSQLite)
        return;
    try {
        await sqliteQuery(`
      ALTER TABLE conversions 
      ADD COLUMN direct_download_url TEXT;
    `);
        console.log('🗃️ Database schema updated successfully (direct_download_url added)');
    }
    catch (error) {
        if (error.message.includes('duplicate column name') || error.message.includes('already exists')) {
            console.log('Column direct_download_url already exists');
        }
        else {
            console.log('Column might already exist:', error.message);
        }
    }
}
// Ensure quality columns exist for both SQLite and PostgreSQL
async function ensureQualityColumns() {
    const columns = [
        { name: 'quality', type: 'VARCHAR(20)', default: "DEFAULT '192k'" },
        { name: 'trim_start', type: useSQLite ? 'REAL' : 'FLOAT', default: '' },
        { name: 'trim_duration', type: useSQLite ? 'REAL' : 'FLOAT', default: '' },
        { name: 'file_size', type: useSQLite ? 'INTEGER' : 'BIGINT', default: '' }
    ];
    for (const column of columns) {
        try {
            if (useSQLite) {
                await sqliteQuery(`
          ALTER TABLE conversions 
          ADD COLUMN ${column.name} ${column.type} ${column.default};
        `);
                console.log(`🗃️ Database schema updated successfully (${column.name} added)`);
            }
            else {
                await query(`
          ALTER TABLE conversions 
          ADD COLUMN IF NOT EXISTS ${column.name} ${column.type} ${column.default};
        `);
                console.log(`🗃️ Database schema updated successfully (${column.name} added)`);
            }
        }
        catch (error) {
            if (error.message.includes('duplicate column name') ||
                error.message.includes('already exists') ||
                error.message.includes('column') && error.message.includes('already exists')) {
                console.log(`Column ${column.name} already exists`);
            }
            else {
                console.log(`Column ${column.name} might already exist:`, error.message);
            }
        }
    }
}
// Test connection on startup
testConnection();
exports.default = db;
//# sourceMappingURL=database.js.map