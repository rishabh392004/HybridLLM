import xarray as xr

print("Accessing WeatherBench 2 Zarr archive for GraphCast...")
# Public Cloud Zarr store for GraphCast predictions
store_url = "gs://weatherbench2/datasets/graphcast/2020/date-variable-single_level.zarr"

# Lazy-load metadata with xarray (no full download needed until indexed)
ds = xr.open_zarr(store_url, storage_options={"token": "anon"})
print(ds)

# Slice desired region & variables (e.g., India bounding box: lat 8-38, lon 68-98)
subset = ds[['2m_temperature', 'total_precipitation_6hr']].sel(
    latitude=slice(38.0, 8.0),
    longitude=slice(68.0, 98.0),
    time="2020-07-01"
)

# Save lightweight NetCDF locally
subset.to_netcdf("data/raw/aifs/graphcast_sample.nc")
print("Saved local subset.")