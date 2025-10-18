#!/usr/bin/env node

/**
 * Emergency database schema fix script
 * This script adds the missing quality columns to the conversions table
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'youtube_converter',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
};

async function fixDatabaseSchema() {
  const pool = new Pool(dbConfig);
  
  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    
    console.log('🔍 Checking current schema...');
    
    // Check if quality column exists
    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'conversions' 
      AND column_name IN ('quality', 'trim_start', 'trim_duration', 'file_size')
    `);
    
    const existingColumns = columnCheck.rows.map(row => row.column_name);
    console.log('📊 Existing columns:', existingColumns);
    
    // Add missing columns
    const columnsToAdd = [
      { name: 'quality', type: 'VARCHAR(20)', default: "DEFAULT '192k'" },
      { name: 'trim_start', type: 'FLOAT', default: '' },
      { name: 'trim_duration', type: 'FLOAT', default: '' },
      { name: 'file_size', type: 'BIGINT', default: '' }
    ];
    
    for (const column of columnsToAdd) {
      if (!existingColumns.includes(column.name)) {
        console.log(`➕ Adding column: ${column.name}`);
        const sql = `ALTER TABLE conversions ADD COLUMN ${column.name} ${column.type} ${column.default}`;
        await client.query(sql);
        console.log(`✅ Added column: ${column.name}`);
      } else {
        console.log(`⏭️  Column already exists: ${column.name}`);
      }
    }
    
    // Create indexes
    console.log('🔗 Creating indexes...');
    const indexes = [
      'CREATE INDEX IF NOT EXISTS idx_conversions_quality ON conversions(quality)',
      'CREATE INDEX IF NOT EXISTS idx_conversions_trim_start ON conversions(trim_start) WHERE trim_start IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_conversions_trim_duration ON conversions(trim_duration) WHERE trim_duration IS NOT NULL',
      'CREATE INDEX IF NOT EXISTS idx_conversions_file_size ON conversions(file_size) WHERE file_size IS NOT NULL'
    ];
    
    for (const indexSql of indexes) {
      try {
        await client.query(indexSql);
        console.log('✅ Index created successfully');
      } catch (error) {
        console.log('⚠️  Index creation skipped (may already exist):', error.message);
      }
    }
    
    // Verify the fix
    console.log('🔍 Verifying schema...');
    const finalCheck = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default 
      FROM information_schema.columns 
      WHERE table_name = 'conversions' 
      AND column_name IN ('quality', 'trim_start', 'trim_duration', 'file_size')
      ORDER BY column_name
    `);
    
    console.log('📋 Final schema:');
    finalCheck.rows.forEach(row => {
      console.log(`   ${row.column_name}: ${row.data_type} (nullable: ${row.is_nullable}, default: ${row.column_default || 'none'})`);
    });
    
    client.release();
    console.log('🎉 Database schema fix completed successfully!');
    
  } catch (error) {
    console.error('❌ Database schema fix failed:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Run the fix
if (require.main === module) {
  fixDatabaseSchema().catch(console.error);
}

module.exports = { fixDatabaseSchema };
