#!/bin/bash
# Deployment script for production
set -e

echo "🔄 Starting deployment..."

# 1. Generate Prisma Client
echo "📦 Generating Prisma Client..."
npx prisma generate

# 2. Run pending migrations
echo "🔧 Running database migrations..."
npx prisma migrate deploy

# 3. Build application
echo "🏗️  Building application..."
npm run build

echo "✅ Deployment complete!"
