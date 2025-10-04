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
    driver: sqlite3_1.default.Database
});
// Initialize database tables
async function initializeDatabase() {
    const database = await exports.db;
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
exports.db.then(() => {
    console.log('Connected to SQLite database');
    initializeDatabase();
}).catch((err) => {
    console.error('Database connection error:', err);
    process.exit(-1);
});
exports.default = exports.db;
//# sourceMappingURL=database.js.map