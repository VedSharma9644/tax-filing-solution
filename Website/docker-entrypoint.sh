#!/bin/sh
set -e

# Get PORT from environment variable (Cloud Run sets this)
PORT=${PORT:-8080}

# Replace $PORT in nginx config template with actual port
sed "s/\$PORT/$PORT/g" /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf

# Execute the main command
exec "$@"

