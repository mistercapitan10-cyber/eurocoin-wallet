#!/bin/bash

# Start production environment
cd "$(dirname "$0")/.."

echo "🚀 Starting Production Environment..."
echo ""

# Stop any existing containers
docker-compose -f docker/docker-compose.prod.yml down --remove-orphans

# Start prod containers
docker-compose -f docker/docker-compose.prod.yml up -d --build

echo ""
echo "✅ Production environment started!"
echo ""
echo "📍 Services:"
echo "   - Web:      http://localhost:3001"
echo "   - Postgres: localhost:5433"
echo "   - Redis:    localhost:6380"
echo ""
echo "📋 Useful commands:"
echo "   - View logs:    docker-compose -f docker/docker-compose.prod.yml logs -f"
echo "   - Stop:         docker-compose -f docker/docker-compose.prod.yml down"
echo "   - Restart:      docker-compose -f docker/docker-compose.prod.yml restart"
echo ""
