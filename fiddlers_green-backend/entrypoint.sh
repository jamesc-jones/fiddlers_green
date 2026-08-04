#!/bin/sh
echo "Running database migrations..."
if alembic upgrade head; then
    echo "Migrations complete. Starting server..."
else
    echo "WARNING: Database migrations failed or the database is unavailable. Starting the server anyway so non-DB endpoints (e.g. /health, /chat) remain available; DB-dependent features may be degraded until migrations succeed." >&2
fi
exec uvicorn main:app --host 0.0.0.0 --port 8000
