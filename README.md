# HybridLLM - Operational Weather Blending Pipeline

HybridLLM successfully aggregates and blends diverse weather prediction sources (like ECMWF IFS and AI models like GraphCast) to generate a statistically robust hybrid forecast.

## Repository Structure

- ackend/: Core FastAPI application, SQLAlchemy models, Alembic migrations, and backend-specific tests/scripts.
- dashboard/: Streamlit interactive web dashboard.
- models/: Machine learning models and checkpoints.
- pipelines/: Forecast generation, AI/NWP blending engines, and data pipelines.
- data/: Datasets, cache, and seed files.

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
   docker compose exec api alembic -c backend/alembic.ini upgrade head
   \\\

5. **Seed deterministic synthetic data:**
   Populate observations and forecasts:
   \\\ash
   docker compose exec api python backend/scripts/seed.py
   \\\
   Then calculate skills, weights, and extreme weather alerts:
   \\\ash
   docker compose exec api python backend/scripts/calculate_skill.py
   docker compose exec api python backend/scripts/calculate_weights.py
   docker compose exec api python backend/scripts/generate_alerts.py
   \\\

6. **Run Tests:**
   Execute the full backend test suite:
   ```bash
   docker compose exec api pytest backend/tests/
   ```

7. **View the Interactive Dashboard:**
   Navigate to [http://localhost:8502](http://localhost:8502) in your browser.

8. **Explore the API (Swagger):**
   Navigate to [http://localhost:8001/docs](http://localhost:8001/docs) in your browser.



