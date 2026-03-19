#!/usr/bin/env bash
set -euo pipefail
DIR="${1:-./backups}"
KEEP="${2:-30}"
mkdir -p "$DIR"
PASS=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2)
FILE="$DIR/da40_$(date +%Y%m%d_%H%M%S).sql.gz"
docker compose exec -T -e PGPASSWORD="$PASS" postgres pg_dump -U postgres -d postgres | gzip > "$FILE"
echo "  ✓ Backup: $FILE ($(du -sh "$FILE" | cut -f1))"
ls -t "$DIR"/da40_*.sql.gz 2>/dev/null | tail -n +$((KEEP+1)) | xargs -r rm
