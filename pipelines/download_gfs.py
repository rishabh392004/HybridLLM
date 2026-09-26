from datetime import datetime, timezone
import os
from herbie import Herbie

os.makedirs("data/raw/gfs", exist_ok=True)

# Query recent run (GFS runs at 00, 06, 12, 18 UTC)
# Using today's latest 00z run
now = datetime.now(timezone.utc)
date_str = now.strftime("%Y-%m-%d 00:00")

print(f"Connecting to GFS on AWS S3 for run: {date_str}...")

# Initialize Herbie for 24-hour lead time (f24)
H = Herbie(
    date_str,
    model="gfs",
    product="pgrb2.0p25",
    fxx=24
)

# Download targeted variables: Temperature (2m), Precipitation, Wind (10m)
# Search string uses GRIB2 shortNames/descriptions
search_pattern = ":(TMP:2 m above ground|APCP:surface|UGRD:10 m above ground|VGRD:10 m above ground):"

print("Downloading GFS subset...")
H.download(search_pattern, save_dir="data/raw/gfs")
print("GFS downloaded to data/raw/gfs/")