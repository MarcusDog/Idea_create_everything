#!/bin/bash

# Backend entrypoint script

set -e

echo "Starting Idea Create Everything Backend..."

# Check if using PostgreSQL
if [[ "$DATABASE_URL" == *"postgresql"* ]]; then
    echo "Waiting for PostgreSQL database..."
    # Extract host from DATABASE_URL (simplified)
    DB_HOST="${DATABASE_HOST:-postgres}"

    for i in {1..30}; do
        if pg_isready -h "$DB_HOST" -p 5432 -q 2>/dev/null; then
            echo "PostgreSQL is ready!"
            break
        fi
        echo "Waiting for PostgreSQL... ($i/30)"
        sleep 2
    done
else
    echo "Using SQLite database, no waiting required."
    # Ensure data directory exists
    mkdir -p /app/data
fi

# Run database migrations
echo "Running database migrations..."
alembic upgrade head || echo "Migration skipped or failed (may be normal for first run)"

# Create necessary directories
mkdir -p /app/logs /app/uploads /app/backups

# Start the application
echo "Starting FastAPI application..."
if [ "$DEBUG" = "true" ] || [ "$DEBUG" = "True" ]; then
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
else
    exec uvicorn app.main:app --host 0.0.0.0 --port 8000
fi
