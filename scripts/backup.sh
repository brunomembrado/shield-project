#!/bin/sh
# Production-like backup script for PostgreSQL
# Runs automatically via cron in the backup container

set -e

BACKUP_DIR="/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=${BACKUP_RETENTION_DAYS:-7}

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

echo "[$(date)] Starting PostgreSQL backup..."

# Backup all databases
for db in shield_auth shield_wallets shield_transactions shield_blockchain shield_compliance; do
  echo "[$(date)] Backing up database: $db"
  
  # Create database backup
  pg_dump -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -F c -b -v -f "$BACKUP_DIR/${db}_${TIMESTAMP}.dump" "$db" || {
    echo "[$(date)] ERROR: Failed to backup database $db"
    continue
  }
  
  echo "[$(date)] Successfully backed up database: $db"
done

# Compress old backups
echo "[$(date)] Compressing backups..."
gzip "$BACKUP_DIR"/*.dump 2>/dev/null || true

# Remove old backups (keep last N days)
echo "[$(date)] Cleaning up backups older than $RETENTION_DAYS days..."
find "$BACKUP_DIR" -name "*.dump.gz" -type f -mtime +$RETENTION_DAYS -delete

echo "[$(date)] Backup completed successfully"

