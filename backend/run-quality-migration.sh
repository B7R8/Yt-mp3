#!/bin/bash

# Script to run the quality columns migration
# This adds the missing quality, trim_start, trim_duration, and file_size columns

echo "🔄 Running quality columns migration..."

# Check if we're using PostgreSQL or SQLite
if [ -f "conversions.db" ]; then
    echo "📊 Detected SQLite database"
    echo "⚠️  SQLite doesn't support IF NOT EXISTS for ALTER TABLE ADD COLUMN"
    echo "📝 Please manually add the following columns to your conversions table:"
    echo "   - quality VARCHAR(20) DEFAULT '192k'"
    echo "   - trim_start REAL"
    echo "   - trim_duration REAL" 
    echo "   - file_size INTEGER"
    echo ""
    echo "🔧 You can use SQLite browser or run these commands:"
    echo "   sqlite3 conversions.db \"ALTER TABLE conversions ADD COLUMN quality VARCHAR(20) DEFAULT '192k';\""
    echo "   sqlite3 conversions.db \"ALTER TABLE conversions ADD COLUMN trim_start REAL;\""
    echo "   sqlite3 conversions.db \"ALTER TABLE conversions ADD COLUMN trim_duration REAL;\""
    echo "   sqlite3 conversions.db \"ALTER TABLE conversions ADD COLUMN file_size INTEGER;\""
else
    echo "🐘 Detected PostgreSQL database"
    echo "🚀 Running migration..."
    
    # Run the migration
    PGPASSWORD=${POSTGRES_PASSWORD:-ytmp3_password} psql -h ${POSTGRES_HOST:-localhost} -p ${POSTGRES_PORT:-5432} -U ${POSTGRES_USER:-ytmp3_user} -d ${POSTGRES_DB:-ytmp3} -f migrations/003_add_quality_columns.sql
    
    if [ $? -eq 0 ]; then
        echo "✅ Migration completed successfully!"
    else
        echo "❌ Migration failed!"
        exit 1
    fi
fi

echo "🎉 Database schema update complete!"
