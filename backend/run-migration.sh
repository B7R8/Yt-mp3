#!/bin/bash

# Quick migration script to add processed_path column
# This can be run manually on the server to fix the database schema

echo "🔄 Adding processed_path column to conversions table..."

# Run the migration directly
PGPASSWORD="${DB_PASSWORD:-postgres}" psql -h "${DB_HOST:-postgres}" -p "${DB_PORT:-5432}" -U "${DB_USER:-postgres}" -d "${DB_NAME:-youtube_converter}" -c "
ALTER TABLE conversions ADD COLUMN IF NOT EXISTS processed_path TEXT;
CREATE INDEX IF NOT EXISTS idx_conversions_processed_path ON conversions(processed_path) WHERE processed_path IS NOT NULL;
"

echo "✅ Migration completed!"
