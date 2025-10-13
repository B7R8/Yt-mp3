"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optimizedDb = void 0;
const sqlite3_1 = __importDefault(require("sqlite3"));
const sqlite_1 = require("sqlite");
const path_1 = __importDefault(require("path"));
const events_1 = require("events");
class OptimizedDatabase extends events_1.EventEmitter {
    constructor() {
        super();
        this.isInitialized = false;
        this.dbPath = path_1.default.join(process.cwd(), 'conversions.db');
        this.pool = {
            connections: [],
            available: [],
            inUse: new Set(),
            maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10')
        };
    }
    async initialize() {
        if (this.isInitialized)
            return;
        try {
            // Create initial connections
            for (let i = 0; i < this.pool.maxConnections; i++) {
                const db = await (0, sqlite_1.open)({
                    filename: this.dbPath,
                    driver: sqlite3_1.default.Database,
                    mode: sqlite3_1.default.OPEN_READWRITE | sqlite3_1.default.OPEN_CREATE
                });
                // Optimize SQLite settings for performance
                await db.exec(`
          PRAGMA journal_mode = WAL;
          PRAGMA synchronous = NORMAL;
          PRAGMA cache_size = 10000;
          PRAGMA temp_store = MEMORY;
          PRAGMA mmap_size = 268435456;
          PRAGMA optimize;
        `);
                this.pool.connections.push(db);
                this.pool.available.push(db);
            }
            // Initialize database schema
            await this.initializeSchema();
            this.isInitialized = true;
            console.log(`Database pool initialized with ${this.pool.maxConnections} connections`);
        }
        catch (error) {
            console.error('Failed to initialize database pool:', error);
            throw error;
        }
    }
    async initializeSchema() {
        const db = this.pool.connections[0]; // Use first connection for schema setup
        // Set UTF-8 encoding
        await db.exec(`PRAGMA encoding = "UTF-8"`);
        await db.exec(`PRAGMA foreign_keys = ON`);
        // Create conversions table with optimized indexes
        await db.exec(`
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
        // Create optimized indexes
        await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_conversions_status ON conversions(status);
      CREATE INDEX IF NOT EXISTS idx_conversions_created_at ON conversions(created_at);
      CREATE INDEX IF NOT EXISTS idx_conversions_updated_at ON conversions(updated_at);
    `);
        // Create blacklist table with optimized indexes
        await db.exec(`
      CREATE TABLE IF NOT EXISTS blacklist (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        type TEXT NOT NULL CHECK (type IN ('channel', 'url', 'video_id')),
        value TEXT NOT NULL,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        created_by TEXT DEFAULT 'admin'
      )
    `);
        await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_blacklist_type_value ON blacklist(type, value);
    `);
        // Create cache table for conversion results
        await db.exec(`
      CREATE TABLE IF NOT EXISTS conversion_cache (
        cache_key TEXT PRIMARY KEY,
        youtube_url TEXT NOT NULL,
        quality TEXT NOT NULL,
        trim_start TEXT,
        trim_end TEXT,
        file_path TEXT NOT NULL,
        file_size INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
        access_count INTEGER DEFAULT 1
      )
    `);
        await db.exec(`
      CREATE INDEX IF NOT EXISTS idx_cache_url_quality ON conversion_cache(youtube_url, quality);
      CREATE INDEX IF NOT EXISTS idx_cache_last_accessed ON conversion_cache(last_accessed);
    `);
        // Add columns if they don't exist (for existing databases)
        try {
            await db.exec(`ALTER TABLE conversions ADD COLUMN progress INTEGER DEFAULT 0`);
        }
        catch (e) { /* Column already exists */ }
        try {
            await db.exec(`ALTER TABLE conversions ADD COLUMN quality_message TEXT`);
        }
        catch (e) { /* Column already exists */ }
        console.log('Database schema initialized with optimizations');
    }
    async getConnection() {
        if (!this.isInitialized) {
            await this.initialize();
        }
        // Wait for available connection
        while (this.pool.available.length === 0) {
            await new Promise(resolve => setTimeout(resolve, 10));
        }
        const connection = this.pool.available.pop();
        this.pool.inUse.add(connection);
        return connection;
    }
    releaseConnection(connection) {
        if (this.pool.inUse.has(connection)) {
            this.pool.inUse.delete(connection);
            this.pool.available.push(connection);
        }
    }
    async withConnection(callback) {
        const connection = await this.getConnection();
        try {
            return await callback(connection);
        }
        finally {
            this.releaseConnection(connection);
        }
    }
    // Optimized query methods
    async get(query, params = []) {
        return this.withConnection(async (db) => {
            return await db.get(query, params);
        });
    }
    async all(query, params = []) {
        return this.withConnection(async (db) => {
            return await db.all(query, params);
        });
    }
    async run(query, params = []) {
        return this.withConnection(async (db) => {
            return await db.run(query, params);
        });
    }
    async exec(query) {
        return this.withConnection(async (db) => {
            return await db.exec(query);
        });
    }
    // Batch operations for better performance
    async batchRun(queries) {
        return this.withConnection(async (db) => {
            await db.exec('BEGIN TRANSACTION');
            try {
                for (const { query, params } of queries) {
                    await db.run(query, params);
                }
                await db.exec('COMMIT');
            }
            catch (error) {
                await db.exec('ROLLBACK');
                throw error;
            }
        });
    }
    // Cache management
    async getCachedConversion(cacheKey) {
        return this.get('SELECT * FROM conversion_cache WHERE cache_key = ?', [cacheKey]);
    }
    async setCachedConversion(cacheKey, youtubeUrl, quality, filePath, fileSize, trimStart, trimEnd) {
        await this.run(`INSERT OR REPLACE INTO conversion_cache 
       (cache_key, youtube_url, quality, trim_start, trim_end, file_path, file_size, last_accessed, access_count)
       VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), 1)`, [cacheKey, youtubeUrl, quality, trimStart, trimEnd, filePath, fileSize]);
    }
    async updateCacheAccess(cacheKey) {
        await this.run('UPDATE conversion_cache SET last_accessed = datetime(\'now\'), access_count = access_count + 1 WHERE cache_key = ?', [cacheKey]);
    }
    async cleanupOldCache(maxAgeHours = 24) {
        const result = await this.run('DELETE FROM conversion_cache WHERE last_accessed < datetime(\'now\', \'-? hours\')', [maxAgeHours]);
        return result.changes || 0;
    }
    // Performance monitoring
    getPoolStats() {
        return {
            totalConnections: this.pool.connections.length,
            availableConnections: this.pool.available.length,
            inUseConnections: this.pool.inUse.size
        };
    }
    async close() {
        for (const connection of this.pool.connections) {
            await connection.close();
        }
        this.pool.connections = [];
        this.pool.available = [];
        this.pool.inUse.clear();
    }
}
// Export singleton instance
exports.optimizedDb = new OptimizedDatabase();
exports.default = exports.optimizedDb;
//# sourceMappingURL=optimizedDatabase.js.map