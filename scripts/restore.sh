#!/bin/sh
# Production-like restore script for PostgreSQL
# Usage: ./restore.sh <database_name> <backup_file>

set -e

if [ $# -lt 2 ]; then
  echo "Usage: $0 <database_name> <backup_file>"
  echo "Example: $0 shield_auth backups/shield_auth_20241116_020000.dump.gz"
  exit 1
fi

DB_NAME=$1
BACKUP_FILE=$2

if [ ! -f "$BACKUP_FILE" ]; then
  echo "ERROR: Backup file not found: $BACKUP_FILE"
  exit 1
fi

echo "[$(date)] Starting restore of database: $DB_NAME"
echo "[$(date)] Backup file: $BACKUP_FILE"

# Decompress if needed
if [[ "$BACKUP_FILE" == *.gz ]]; then
  echo "[$(date)] Decompressing backup file..."
  gunzip -c "$BACKUP_FILE" > "${BACKUP_FILE%.gz}"
  BACKUP_FILE="${BACKUP_FILE%.gz}"
fi

# Restore database
echo "[$(date)] Restoring database..."
pg_restore -h "$PGHOST" -p "$PGPORT" -U "$PGUSER" -d "$DB_NAME" -c -v "$BACKUP_FILE" || {
  echo "[$(date)] ERROR: Failed to restore database"
  exit 1
}

echo "[$(date)] Database restored successfully"

