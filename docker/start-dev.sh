#!/bin/bash

# Start development environment
cd "$(dirname "$0")/.."

echo "🚀 Starting Development Environment..."
echo ""

# Stop any existing containers
docker-compose -f docker/docker-compose.dev.yml down --remove-orphans

# Start dev containers
docker-compose -f docker/docker-compose.dev.yml up -d

echo ""
echo "✅ Development environment started!"
echo ""
echo "📍 Services:"
echo "   - Web:      http://localhost:3000"
echo "   - Postgres: localhost:5432"
echo "   - Redis:    localhost:6379"
echo ""
echo "📋 Useful commands:"
echo "   - View logs:    docker-compose -f docker/docker-compose.dev.yml logs -f"
echo "   - Stop:         docker-compose -f docker/docker-compose.dev.yml down"
echo "   - Restart:      docker-compose -f docker/docker-compose.dev.yml restart"
echo ""
