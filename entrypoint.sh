#!/bin/sh
set -e

# Ensure the data directory exists before the server starts.
mkdir -p /app/data

exec node server/dist/index.js
