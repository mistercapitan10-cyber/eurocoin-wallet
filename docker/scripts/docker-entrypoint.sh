#!/bin/sh

set -e

if [ "${NODE_ENV}" = "development" ] && [ ! -d node_modules ]; then
  echo "[entrypoint] node_modules missing, running npm install..."
  npm install --legacy-peer-deps
fi

if [ -n "$HEALTHCHECK_URL" ]; then
  SERVICE_NAME="${SERVICE_NAME:-app}"
  HEALTHCHECK_INTERVAL="${HEALTHCHECK_INTERVAL:-15000}"

  node ./docker/scripts/health-logger.mjs "$SERVICE_NAME" "$HEALTHCHECK_URL" "$HEALTHCHECK_INTERVAL" &
fi

exec "$@"
