import os
import sys
from datetime import datetime, timedelta

# Add the backend directory to python path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend')))

from seed import seed_data

def simulate_days(days: int = 30):
    print(f"Simulating {days} days of historical data generation...")
    # This acts as a wrapper around the seeder for now,
    # but provides the structure to later simulate day-by-day operations
    # (e.g., generate obs -> compute skill -> update weights)
    seed_data(days=days)
    print("Simulation complete.")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Simulate multiple historical days")
    parser.add_argument("--days", type=int, default=30, help="Number of days to simulate")
    args = parser.parse_args()
    
    simulate_days(days=args.days)
