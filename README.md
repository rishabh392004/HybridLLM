# HybridLLM - Operational Weather Blending Pipeline

HybridLLM successfully aggregates and blends diverse weather prediction sources (like ECMWF IFS and AI models like GraphCast) to generate a statistically robust hybrid forecast.

## Demonstration (M8 Certified E2E Setup)

The shortest sequence to run the full production-style stack on a clean machine:

1. **Clone the repository:**
   \\\ash
   git clone https://github.com/rishabh392004/HybridLLM.git
   cd HybridLLM
   \\\

2. **Configure environment:**
   Copy the example environment configuration to .env:
   \\\ash
   cp .env.example .env
   \\\

3. **Start the stack:**
   Build and start all components (API, Dashboard, Postgres, Redis):
   \\\ash
   docker compose up -d --build
   \\\

4. **Run database migrations:**
   Prepare the PostgreSQL schema:
   \\\ash
   docker compose exec api alembic upgrade head
   \\\

5. **Seed deterministic synthetic data:**
   Populate observations and forecasts:
   \\\ash
   docker compose exec api python scripts/seed.py
   \\\
   Then calculate skills, weights, and extreme weather alerts:
   \\\ash
   docker compose exec api python scripts/calculate_skill.py
   docker compose exec api python scripts/calculate_weights.py
   docker compose exec api python scripts/generate_alerts.py
   \\\

6. **View the Interactive Dashboard:**
   Navigate to [http://localhost:8502](http://localhost:8502) in your browser.

7. **Explore the API (Swagger):**
   Navigate to [http://localhost:8001/docs](http://localhost:8001/docs) in your browser.
