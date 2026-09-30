FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    build-essential \
    libpq-dev \
    curl \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN update-ca-certificates && pip install --no-cache-dir -r requirements.txt

COPY . .

# Sanitize line endings for Linux container execution
RUN sed -i 's/\r$//' /app/backend/entrypoint.sh && chmod +x /app/backend/entrypoint.sh

RUN useradd -m appuser && chown -R appuser /app
USER appuser

ENV PYTHONPATH=/app/backend:/app \
    PYTHONUNBUFFERED=1

ENTRYPOINT ["/app/backend/entrypoint.sh"]
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
