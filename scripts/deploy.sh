# scripts/deploy.sh
#!/bin/bash

set -e

echo "🚀 Starting ZenAI Production Deployment..."

# Pull latest code
git pull origin main

# Build and start services
docker-compose -f docker-compose.prod.yml build
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 30

# Run database migrations
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

# Check health
echo "🏥 Checking service health..."
curl -f http://localhost/health || exit 1

echo "✅ Deployment completed successfully!"