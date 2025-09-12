#!/bin/bash

# EmailPro Backup Script
# Creates backups of database and application files

set -e

# Configuration
BACKUP_DIR="/var/backups/emailpro"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Source environment variables
if [ -f .env ]; then
    source .env
fi

# Extract database info from DATABASE_URL
if [ -z "$DATABASE_URL" ]; then
    echo "❌ DATABASE_URL not found in .env file"
    exit 1
fi

# Parse DATABASE_URL (postgresql://user:password@host:port/database)
DB_USER=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/\([^:]*\):.*/\1/p')
DB_PASSWORD=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^:]*:\([^@]*\)@.*/\1/p')
DB_HOST=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^@]*@\([^:]*\):.*/\1/p')
DB_PORT=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/[^@]*@[^:]*:\([^\/]*\)\/.*/\1/p')
DB_NAME=$(echo $DATABASE_URL | sed -n 's/postgresql:\/\/.*\/\(.*\)/\1/p')

echo "📦 EmailPro Backup Script"
echo "========================="
echo "Date: $(date)"
echo "Database: $DB_NAME@$DB_HOST:$DB_PORT"

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "🗄️  Creating database backup..."
export PGPASSWORD=$DB_PASSWORD
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME > "$BACKUP_DIR/emailpro_db_$DATE.sql"

if [ $? -eq 0 ]; then
    echo "✅ Database backup completed: emailpro_db_$DATE.sql"
else
    echo "❌ Database backup failed"
    exit 1
fi

# Application files backup
echo "📁 Creating application files backup..."
tar -czf "$BACKUP_DIR/emailpro_app_$DATE.tar.gz" \
    --exclude=node_modules \
    --exclude=dist \
    --exclude=logs \
    --exclude=.git \
    --exclude=attached_assets \
    .

if [ $? -eq 0 ]; then
    echo "✅ Application backup completed: emailpro_app_$DATE.tar.gz"
else
    echo "❌ Application backup failed"
    exit 1
fi

# PM2 configuration backup
echo "⚙️  Creating PM2 configuration backup..."
pm2 save --force
cp ~/.pm2/dump.pm2 "$BACKUP_DIR/pm2_config_$DATE.json" 2>/dev/null || echo "⚠️  PM2 config backup skipped (not running)"

# Environment configuration backup
echo "🔐 Creating environment configuration backup..."
if [ -f .env ]; then
    cp .env "$BACKUP_DIR/env_config_$DATE.txt"
    echo "✅ Environment config backed up"
fi

# Clean old backups
echo "🧹 Cleaning old backups (keeping $RETENTION_DAYS days)..."
find $BACKUP_DIR -name "emailpro_*" -mtime +$RETENTION_DAYS -delete
echo "✅ Old backups cleaned"

# Display backup summary
echo ""
echo "📊 Backup Summary"
echo "=================="
echo "Location: $BACKUP_DIR"
echo "Files created:"
ls -lh "$BACKUP_DIR" | grep $DATE

# Calculate total backup size
TOTAL_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo "Total backup size: $TOTAL_SIZE"

echo ""
echo "✅ Backup completed successfully!"
echo "📝 To restore:"
echo "   Database: psql -h $DB_HOST -p $DB_PORT -U $DB_USER $DB_NAME < emailpro_db_$DATE.sql"
echo "   Application: tar -xzf emailpro_app_$DATE.tar.gz"