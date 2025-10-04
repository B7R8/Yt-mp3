"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTables = createTables;
const database_1 = __importDefault(require("../config/database"));
const logger_1 = __importDefault(require("../config/logger"));
async function createTables() {
    const client = await database_1.default.connect();
    try {
        await client.query('BEGIN');
        // Create conversions table
        await client.query(`
      CREATE TABLE IF NOT EXISTS conversions (
        id UUID PRIMARY KEY,
        youtube_url TEXT NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'pending',
        mp3_filename VARCHAR(255),
        error_message TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `);
        // Create index on status for faster queries
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversions_status 
      ON conversions(status)
    `);
        // Create index on created_at for cleanup queries
        await client.query(`
      CREATE INDEX IF NOT EXISTS idx_conversions_created_at 
      ON conversions(created_at)
    `);
        await client.query('COMMIT');
        logger_1.default.info('Database tables created successfully');
    }
    catch (error) {
        await client.query('ROLLBACK');
        logger_1.default.error('Failed to create tables:', error);
        throw error;
    }
    finally {
        client.release();
    }
}
async function migrate() {
    try {
        await createTables();
        logger_1.default.info('Migration completed successfully');
        process.exit(0);
    }
    catch (error) {
        logger_1.default.error('Migration failed:', error);
        process.exit(1);
    }
}
// Run migration if this file is executed directly
if (require.main === module) {
    migrate();
}
//# sourceMappingURL=migrate.js.map