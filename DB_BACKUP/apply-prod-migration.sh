#!/bin/bash
# Apply migration to production database
# Usage: ./apply-prod-migration.sh <PRODUCTION_DATABASE_URL>

if [ -z "$1" ]; then
  echo "❌ Error: Missing DATABASE_URL argument"
  echo ""
  echo "Usage:"
  echo "  ./apply-prod-migration.sh 'postgresql://user:pass@host:port/db'"
  echo ""
  echo "Or set environment variable:"
  echo "  export PROD_DATABASE_URL='postgresql://...'"
  echo "  ./apply-prod-migration.sh"
  exit 1
fi

DATABASE_URL="${1:-$PROD_DATABASE_URL}"

echo "🔄 Applying migration to production database..."
echo "📍 Target: ${DATABASE_URL%%@*}@***" # Hide credentials in output

psql "$DATABASE_URL" -f manual-migration-prod.sql

if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Migration applied successfully!"
  echo ""
  echo "🔄 Next steps:"
  echo "1. Redeploy your NestJS service on Render"
  echo "2. Check API: curl https://mirchan-expres-api.onrender.com/posts"
else
  echo ""
  echo "❌ Migration failed! Check errors above."
  exit 1
fi
