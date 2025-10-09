"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.db = void 0;
exports.initializeDatabase = initializeDatabase;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
// Create SQLite database connection
const dbPath = path_1.default.join(process.cwd(), 'conversions.db');
exports.db = (0, sqlite_1.open)({
    filename: dbPath,
    driver: sqlite3_1.default.Database,
    // Ensure UTF-8 support for SQLite
    mode: sqlite3_1.default.OPEN_READWRITE | sqlite3_1.default.OPEN_CREATE
});
// Initialize database tables
async function initializeDatabase() {
    const database = await exports.db;
    // Set UTF-8 encoding for the database
    await database.exec(`PRAGMA encoding = "UTF-8"`);
    await database.exec(`PRAGMA foreign_keys = ON`);
    await database.exec(`
    CREATE TABLE IF NOT EXISTS conversions (
      id TEXT PRIMARY KEY,
      youtube_url TEXT NOT NULL,
      video_title TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      progress INTEGER DEFAULT 0,
      mp3_filename TEXT,
      error_message TEXT,
      quality_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
    // Create blacklist table
    await database.exec(`
    CREATE TABLE IF NOT EXISTS blacklist (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL CHECK (type IN ('channel', 'url', 'video_id')),
      value TEXT NOT NULL,
      reason TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT DEFAULT 'admin'
    )
  `);
    // Add progress column if it doesn't exist (for existing databases)
    await database.exec(`
    ALTER TABLE conversions ADD COLUMN progress INTEGER DEFAULT 0
  `).catch(() => {
        // Column already exists, ignore error
    });
    // Add quality_message column if it doesn't exist (for existing databases)
    await database.exec(`
    ALTER TABLE conversions ADD COLUMN quality_message TEXT
  `).catch(() => {
        // Column already exists, ignore error
    });
    console.log('SQLite database initialized');
}
// Test database connection
exports.db.then(() => {
    console.log('Connected to SQLite database');
    initializeDatabase();
}).catch((err) => {
    console.error('Database connection error:', err);
    process.exit(-1);
});
exports.default = exports.db;
//# sourceMappingURL=database.js.map