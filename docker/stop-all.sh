#!/bin/bash

# Stop all environments
cd "$(dirname "$0")/.."

echo "🛑 Stopping all environments..."
echo ""

# Stop dev
echo "Stopping Development..."
docker-compose -f docker/docker-compose.dev.yml down --remove-orphans

# Stop prod
echo "Stopping Production..."
docker-compose -f docker/docker-compose.prod.yml down --remove-orphans

echo ""
echo "✅ All environments stopped!"
echo ""
