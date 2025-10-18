#!/usr/bin/env node

/**
 * Database Migration Script
 * 
 * This script helps set up the database schema for the audio processing feature.
 * It can be run locally or in production to ensure the jobs table exists.
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'youtube_converter',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
};

async function runMigration() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Starting database migration...');
    console.log(`📊 Connecting to database: ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`);
    
    // Test connection
    const client = await pool.connect();
    console.log('✅ Database connection successful');
    
    // Run all migrations in order
    const migrations = [
      '001_create_jobs_table.sql',
      '002_add_processed_path_column.sql'
    ];
    
    for (const migrationFile of migrations) {
      const migrationPath = path.join(__dirname, '..', 'migrations', migrationFile);
      
      if (fs.existsSync(migrationPath)) {
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Execute migration
        console.log(`📝 Executing migration: ${migrationFile}`);
        await client.query(migrationSQL);
        console.log(`✅ Migration ${migrationFile} completed`);
      } else {
        console.log(`⚠️ Migration file not found: ${migrationFile}`);
      }
    }
    
    console.log('✅ Migration completed successfully');
    
    // Verify table exists
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name = 'jobs'
    `);
    
    if (result.rows.length > 0) {
      console.log('✅ Jobs table verified');
    } else {
      console.log('❌ Jobs table not found after migration');
      process.exit(1);
    }
    
    client.release();
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run migration if called directly
if (require.main === module) {
  runMigration().catch(error => {
    console.error('❌ Migration script failed:', error);
    process.exit(1);
  });
}

module.exports = { runMigration };
