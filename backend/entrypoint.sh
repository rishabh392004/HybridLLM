#!/bin/bash
set -e

# Change to the backend directory where alembic.ini is
cd /app/backend

echo "Running database migrations..."
alembic upgrade head

echo "Seeding initial data if needed (365 days for seasonal skill)..."
# Seed 365 days to ensure we have enough data for all seasons
python scripts/seed.py

echo "Calculating initial skill scores..."
python scripts/calculate_skill.py

echo "Optimizing adaptive weights..."
python scripts/calculate_weights.py

echo "Generating active alerts..."
python scripts/generate_alerts.py

# Go back to /app so PYTHONPATH works correctly
cd /app

echo "Starting API..."
exec "$@"
