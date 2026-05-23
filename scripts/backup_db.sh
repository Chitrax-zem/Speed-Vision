#!/bin/bash
# Database backup script for the Vehicle Detection & Speed Tracking Platform
# Creates a compressed PostgreSQL dump and manages backup rotation

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# Configuration
BACKUP_DIR="$PROJECT_ROOT/backups"
DB_NAME="${DB_NAME:-vstrack_db}"
DB_USER="${DB_USER:-vstrack}"
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
RETENTION_DAYS=${RETENTION_DAYS:-30}

# Create backup directory
mkdir -p "$BACKUP_DIR"

# Generate timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/${DB_NAME}_${TIMESTAMP}.sql.gz"

echo -e "${GREEN}╔══════════════════════════════════════════════════════════════╗"
echo -e "║           🗄️  Database Backup Utility                      ║"
echo -e "╚══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  Database: ${DB_NAME}"
echo -e "  Host: ${DB_HOST}:${DB_PORT}"
echo -e "  User: ${DB_USER}"
echo -e "  Backup: ${BACKUP_FILE}"
echo ""

# Check if running in Docker
if docker compose -f "$PROJECT_ROOT/docker/docker-compose.yml" ps db 2>/dev/null | grep -q "Up" 2>/dev/null; then
    echo -e "${YELLOW}Detected PostgreSQL running in Docker...${NC}"
    
    # Backup from Docker container
    docker compose -f "$PROJECT_ROOT/docker/docker-compose.yml" exec -T db \
        pg_dump -U "$DB_USER" -d "$DB_NAME" --clean --if-exists | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup created successfully${NC}"
    else
        echo -e "${RED}❌ Backup failed${NC}"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
elif command -v pg_dump &> /dev/null; then
    echo -e "${YELLOW}Using local pg_dump...${NC}"
    
    # Backup using local pg_dump
    PGPASSWORD="${DB_PASSWORD}" pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --clean --if-exists | gzip > "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Backup created successfully${NC}"
    else
        echo -e "${RED}❌ Backup failed${NC}"
        rm -f "$BACKUP_FILE"
        exit 1
    fi
else
    echo -e "${RED}❌ Neither Docker PostgreSQL nor pg_dump found.${NC}"
    echo -e "   Please install PostgreSQL client tools or start the Docker services."
    exit 1
fi

# Show backup file size
BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
echo -e "  File size: ${BACKUP_SIZE}"

# Clean up old backups
echo -e "\n${YELLOW}Cleaning up backups older than ${RETENTION_DAYS} days...${NC}"
DELETED=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +${RETENTION_DAYS} -delete -print | wc -l)
echo -e "  Removed ${DELETED} old backup(s)"

# List remaining backups
echo -e "\n${YELLOW}Available backups:${NC}"
ls -lh "$BACKUP_DIR"/*.sql.gz 2>/dev/null | awk '{print "  " $9, "(" $5 ")"}' || echo "  No backups found"

echo -e "\n${GREEN}Backup complete!${NC}"
