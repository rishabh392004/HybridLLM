from ecmwf.opendata import Client
import os

os.makedirs("data/raw/ecmwf", exist_ok=True)
os.makedirs("data/raw/aifs", exist_ok=True)

# 1. Download Physical ECMWF IFS (0.25 deg)
client_ifs = Client(source="azure", model="ifs", resol="0p25")
print("Fetching ECMWF IFS physical forecast...")
client_ifs.retrieve(
    type="fc",
    step=[24, 48],                  # Lead times in hours
    param=["2t", "tp", "10u", "10v"], # 2m Temp, Total Precip, 10m Wind
    target="data/raw/ecmwf/ifs_latest.grib2"
)
print("ECMWF IFS downloaded.")

# 2. Download ECMWF AI Model (AIFS 0.25 deg)
# This is an operational deep learning model based on Graph Neural Networks / Transformers
client_aifs = Client(source="azure", model="aifs-single", resol="0p25")
print("Fetching ECMWF AIFS (AI model) forecast...")
client_aifs.retrieve(
    type="fc",
    step=[24, 48],
    param=["2t", "tp", "10u", "10v"],
    target="data/raw/aifs/aifs_latest.grib2"
)
print("ECMWF AIFS downloaded.")