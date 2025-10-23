#!/bin/sh

# Set default port if PORT environment variable is not set
export PORT=${PORT:-3000}

# Substitute PORT variable in nginx config
envsubst '$PORT' < /etc/nginx/nginx.conf.template > /etc/nginx/nginx.conf

# Start nginx
nginx -g "daemon off;"
