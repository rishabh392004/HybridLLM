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

RUN useradd -m appuser && chown -R appuser /app
USER appuser

ENV PYTHONPATH=/app/backend:/app
CMD ["uvicorn", "api.main:app", "--host", "0.0.0.0", "--port", "8000"]
