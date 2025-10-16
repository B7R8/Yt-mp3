"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeDatabase = initializeDatabase;
exports.query = query;
exports.getRow = getRow;
exports.runQuery = runQuery;
const sqlite3_1 = __importDefault(require("sqlite3"));
const util_1 = require("util");
const logger_1 = __importDefault(require("./logger"));
// SQLite database configuration for local development
const dbPath = process.env.SQLITE_DB_PATH || './conversions.db';
// Create SQLite database connection
const db = new sqlite3_1.default.Database(dbPath);
// Promisify database methods for async/await usage
const dbRun = (0, util_1.promisify)(db.run.bind(db));
const dbGet = (0, util_1.promisify)(db.get.bind(db));
const dbAll = (0, util_1.promisify)(db.all.bind(db));
// Initialize database tables
async function initializeDatabase() {
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
    }
    catch (error) {
        console.error('SQLite database initialization error:', error);
        throw error;
    }
}
// Database query helper function
async function query(text, params = []) {
    const start = Date.now();
    try {
        const res = await dbAll(text, params);
        const duration = Date.now() - start;
        if (process.env.LOG_LEVEL === 'debug') {
            logger_1.default.debug('Executed query', { text, duration, rows: res.length });
        }
        return { rows: res, rowCount: res.length };
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
// Get single row
async function getRow(text, params = []) {
    const start = Date.now();
    try {
        const res = await dbGet(text, params);
        const duration = Date.now() - start;
        if (process.env.LOG_LEVEL === 'debug') {
            logger_1.default.debug('Executed query', { text, duration, rows: res ? 1 : 0 });
        }
        return { rows: res ? [res] : [], rowCount: res ? 1 : 0 };
    }
    catch (error) {
        console.error('Database query error:', error);
        throw error;
    }
}
// Insert/Update/Delete operations
async function runQuery(text, params = []) {
    const start = Date.now();
    try {
        const res = await dbRun(text, params);
        const duration = Date.now() - start;
        if (process.env.LOG_LEVEL === 'debug') {
            logger_1.default.debug('Executed query', { text, duration, changes: res.changes });
        }
        return { rowCount: res.changes };
    }
    catch (error) {
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
exports.default = db;
//# sourceMappingURL=sqliteDatabase.js.map