#!/usr/bin/env bash
# Usage: bash scripts/set-instructor.sh your@email.com
set -euo pipefail
EMAIL="${1:?Usage: bash scripts/set-instructor.sh your@email.com}"
PASS=$(grep '^POSTGRES_PASSWORD=' .env | cut -d= -f2)
SAFE_EMAIL=${EMAIL//\'/\'\'}

echo "  Setting instructor: $EMAIL"
RESULT=$(echo "UPDATE public.profiles SET role='instructor', updated_at=now() WHERE email='${SAFE_EMAIL}' RETURNING full_name, role;" | \
    docker compose exec -T -e PGPASSWORD="$PASS" postgres psql -U postgres -d postgres -t)

if echo "$RESULT" | grep -q "instructor"; then
    echo "  ✓ $EMAIL is now an instructor"
    echo "  $RESULT"
else
    echo "  ! User not found. Register first at /auth/register"
    echo ""
    echo "  Existing users:"
    echo "SELECT email, role FROM public.profiles;" | \
        docker compose exec -T -e PGPASSWORD="$PASS" postgres psql -U postgres -d postgres
fi
