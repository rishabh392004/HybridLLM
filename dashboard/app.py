import streamlit as st
import numpy as np
import plotly.graph_objects as go
import sys
import os
from scipy.ndimage import zoom

# Path setup to import pipeline modules
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from pipelines.blend_engine import OperationalBlender
from pipelines.metrics import build_benchmark_table

st.set_page_config(page_title="Operational Weather Blending Framework", layout="wide")

st.title("Operational AI–NWP Multi-Task Blending & Calibration Suite")
st.markdown("Dynamic grid-level weighting, Conformal Uncertainty, XAI, and Real-Time Bias Correction.")

def load_system():
    return OperationalBlender(meta_path="models/model_metadata.json")

blender = load_system()

# Sidebar controls
st.sidebar.header("Operational Synoptic Setup")
region = st.sidebar.selectbox("Geographic Domain", ["Indian Subcontinent (8°-38°N, 68°-98°E)"])
variable_mode = st.sidebar.radio("Active Variable", ["Surface Temperature (°C)", "Precipitation (mm/day)"])
lead_time_hrs = st.sidebar.slider("Forecast Lead Time", 24, 120, 48, step=24)

st.sidebar.header("Bias Correction Engine")
apply_bias_corr = st.sidebar.checkbox("Enable Real-Time Bias Correction", value=True)
heat_bias_slider = st.sidebar.slider("Synthetic Thermal Drift (°C)", 0.0, 5.0, 2.0)
rain_bias_slider = st.sidebar.slider("Synthetic Convective Rain Drift (mm)", 0.0, 25.0, 8.0)

# Generate coordinate grid
lat_res, lon_res = 35, 35
lats = np.linspace(38.0, 8.0, lat_res)
lons = np.linspace(68.0, 98.0, lon_res)
lon_mesh, lat_mesh = np.meshgrid(lons, lats)

# Synthetic Topography (DEM: High Himalayas in North, Western Ghats in SW)
dem = 200.0 + np.exp(-((lat_mesh - 34)**2 + (lon_mesh - 78)**2) / 30.0) * 4500.0 \
            + np.exp(-((lat_mesh - 14)**2 + (lon_mesh - 74)**2) / 10.0) * 1800.0

# Paths for real observations
data_dir = os.path.join(os.path.dirname(__file__), "..", "data")
multivar_npz_path = os.path.join(data_dir, "real_multivar_era5.npz")
single_npz_path = os.path.join(data_dir, "real_test_case_era5.npz")
imd_file_path = os.path.join(data_dir, "IMD_Rainfall_2020.nc")

# 1. Default Synthetic Base Fields
true_temp_k = 300.0 - (lat_mesh - 8.0) * 0.4 - (dem / 1000.0) * 6.5
true_rain_mm = np.clip(np.sin((lat_mesh - 10) / 4.0) * np.cos((lon_mesh - 75) / 5.0) * 45.0, 0, 90)
m1_temp_k = true_temp_k + np.random.normal(0.2, 0.6, true_temp_k.shape)
m1_rain_mm = np.clip(true_rain_mm + np.random.normal(-2.0, 3.5, true_rain_mm.shape), 0, None)

# 2. Priority Loader: Check for Full Multi-Variable Archive (Temp + Rain Real)
if os.path.exists(multivar_npz_path):
    try:
        data_archive = np.load(multivar_npz_path)
        raw_t_truth = data_archive["temp_truth"][0]
        raw_t_ifs = data_archive["temp_ifs"][0]
        raw_r_truth = data_archive["rain_truth"][0]
        raw_r_ifs = data_archive["rain_ifs"][0]

        sy, sx = lat_res / raw_t_truth.shape[0], lon_res / raw_t_truth.shape[1]
        true_temp_k = zoom(raw_t_truth, (sy, sx), order=1)
        m1_temp_k = zoom(raw_t_ifs, (sy, sx), order=1)
        true_rain_mm = np.clip(zoom(raw_r_truth, (sy, sx), order=1), 0, None)
        m1_rain_mm = np.clip(zoom(raw_r_ifs, (sy, sx), order=1), 0, None)

        st.sidebar.success("Loaded Real ERA5 & IFS (Temp + Rain)")
    except Exception as e:
        st.sidebar.warning(f"Failed loading multivar archive: {e}. Falling back...")

# 3. Secondary Loader: Temperature-Only NPZ
elif os.path.exists(single_npz_path):
    try:
        data_archive = np.load(single_npz_path)
        raw_era5 = data_archive["era5"][0]
        sy, sx = lat_res / raw_era5.shape[0], lon_res / raw_era5.shape[1]
        true_temp_k = zoom(raw_era5, (sy, sx), order=1)
        if "ifs" in data_archive:
            m1_temp_k = zoom(data_archive["ifs"][0], (sy, sx), order=1)
        st.sidebar.success("Loaded Real ERA5 Temperature Slice")
    except Exception as e:
        st.sidebar.warning(f"ERA5 Load Error: {e}")

# 4. Tertiary Loader: IMD NetCDF for Rainfall if available
if not os.path.exists(multivar_npz_path) and os.path.exists(imd_file_path):
    try:
        import xarray as xr
        ds_imd = None
        for engine_candidate in ["h5netcdf", "netcdf4", "scipy"]:
            try:
                ds_imd = xr.open_dataset(imd_file_path, engine=engine_candidate)
                break
            except Exception:
                continue

        if ds_imd is not None:
            lat_key = 'latitude' if 'latitude' in ds_imd.coords else 'lat'
            lon_key = 'longitude' if 'longitude' in ds_imd.coords else 'lon'
            rain_key = 'rain' if 'rain' in ds_imd.data_vars else list(ds_imd.data_vars.keys())[0]

            raw_imd_rain = ds_imd[rain_key].isel(time=0).sel(
                **{lat_key: slice(8.0, 38.0), lon_key: slice(68.0, 98.0)}
            ).values

            sy, sx = lat_res / raw_imd_rain.shape[0], lon_res / raw_imd_rain.shape[1]
            true_rain_mm = np.nan_to_num(zoom(raw_imd_rain, (sy, sx), order=1), nan=0.0)
            m1_rain_mm = np.clip(true_rain_mm + np.random.normal(-1.5, 3.0, true_rain_mm.shape), 0, None)
            st.sidebar.success("Loaded Real IMD Gridded Rainfall")
        else:
            st.sidebar.info("IMD NetCDF requires h5netcdf. Using synthetic rainfall.")
    except Exception as e:
        st.sidebar.info(f"IMD Parser info: {e}. Using synthetic rainfall.")

# Forecast Model 2 (GraphCast AI with simulated operational bias)
m2_temp_k = true_temp_k + heat_bias_slider + np.random.normal(-0.1, 0.8, true_temp_k.shape)
m2_rain_mm = np.clip(true_rain_mm + rain_bias_slider + np.random.normal(1.0, 4.0, true_rain_mm.shape), 0, None)

# Run Inference with Online Bias Filter & Verification Loop
(
    b_celsius, b_rain, w_t, w_r, heat_mask, rain_mask, t_bounds, r_bounds, bias_fields, rolling_rmse
) = blender.blend(
    m1_temp_k, m2_temp_k, m1_rain_mm, m2_rain_mm, dem,
    obs_t=true_temp_k, obs_r=true_rain_mm,
    apply_bias_correction=apply_bias_corr
)

# Top KPI Summary
kpi1, kpi2, kpi3, kpi4 = st.columns(4)
kpi1.metric("ECMWF IFS Mean", f"{np.mean(m1_temp_k)-273.15:.1f} °C | {np.mean(m1_rain_mm):.1f} mm")
kpi2.metric("GraphCast AI Mean", f"{np.mean(m2_temp_k)-273.15:.1f} °C | {np.mean(m2_rain_mm):.1f} mm")
kpi3.metric("Hybrid Blended Mean", f"{np.mean(b_celsius):.1f} °C | {np.mean(b_rain):.1f} mm")
kpi4.metric("7-Cycle Rolling RMSE", f"IFS: {rolling_rmse[0]:.2f}°C | AI: {rolling_rmse[1]:.2f}°C")

# Dashboard Tabs
tab_map, tab_weights, tab_bias, tab_xai, tab_benchmark = st.tabs([
    "Interactive GIS Map", "Spatial Weight Distribution", "Real-Time Bias Fields", "Explainable AI (XAI)", "Quantitative Benchmark Suite"
])

def plot_gis_contour(data, title, cbar_title, colorscale="Viridis", zmin=None, zmax=None):
    fig = go.Figure(data=go.Contour(
        z=data, x=lons, y=lats, colorscale=colorscale,
        contours=dict(coloring='heatmap', showlabels=True),
        colorbar=dict(title=cbar_title),
        zmin=zmin, zmax=zmax
    ))
    fig.update_layout(
        title=title,
        xaxis_title="Longitude (°E)", yaxis_title="Latitude (°N)",
        margin=dict(l=20, r=20, t=40, b=20), height=420
    )
    return fig

with tab_map:
    col_1, col_2, col_3 = st.columns(3)
    if "Temperature" in variable_mode:
        with col_1:
            st.plotly_chart(plot_gis_contour(m1_temp_k - 273.15, "Source 1: ECMWF IFS (Physical)", "°C", "RdBu_r", 10, 42), use_container_width=True)
        with col_2:
            st.plotly_chart(plot_gis_contour(m2_temp_k - 273.15, "Source 2: GraphCast AI (Raw Drift)", "°C", "RdBu_r", 10, 42), use_container_width=True)
        with col_3:
            st.plotly_chart(plot_gis_contour(b_celsius, f"Hybrid Blend (Bias Corrected: {apply_bias_corr})", "°C", "RdBu_r", 10, 42), use_container_width=True)
    else:
        with col_1:
            st.plotly_chart(plot_gis_contour(m1_rain_mm, "Source 1: ECMWF IFS Rainfall", "mm/day", "Blues", 0, 80), use_container_width=True)
        with col_2:
            st.plotly_chart(plot_gis_contour(m2_rain_mm, "Source 2: GraphCast AI Rainfall", "mm/day", "Blues", 0, 80), use_container_width=True)
        with col_3:
            st.plotly_chart(plot_gis_contour(b_rain, f"Hybrid Blend (Bias Corrected: {apply_bias_corr})", "mm/day", "Blues", 0, 80), use_container_width=True)

with tab_weights:
    st.subheader("Dynamic Model Reliability Weights (W₁ + W₂ = 1.0)")
    active_weights = w_t if "Temperature" in variable_mode else w_r
    col_w1, col_w2 = st.columns(2)
    with col_w1:
        st.plotly_chart(plot_gis_contour(active_weights[0], "Weight Allocated to ECMWF IFS", "Weight (0-1)", "Blues", 0, 1), use_container_width=True)
    with col_w2:
        st.plotly_chart(plot_gis_contour(active_weights[1], "Weight Allocated to GraphCast AI", "Weight (0-1)", "Oranges", 0, 1), use_container_width=True)

with tab_bias:
    st.subheader("Real-Time Systematic Bias Field (Error Residuals)")
    st.markdown("Maps the estimated drift for each candidate model computed against the recursive verification stream.")
    col_b1, col_b2 = st.columns(2)
    with col_b1:
        st.plotly_chart(plot_gis_contour(bias_fields[0], "ECMWF IFS Real-Time Error Residual", "Bias (°C)", "RdBu_r", -3, 3), use_container_width=True)
    with col_b2:
        st.plotly_chart(plot_gis_contour(bias_fields[1], "GraphCast AI Real-Time Error Residual", "Bias (°C)", "RdBu_r", -3, 3), use_container_width=True)

with tab_xai:
    st.subheader("Spatial Feature Attribution (SHAP / Input×Gradient Equivalent)")
    terrain_attr, model_attr = blender.compute_saliency(m1_temp_k, m2_temp_k, m1_rain_mm, m2_rain_mm, dem)
    col_x1, col_x2 = st.columns(2)
    with col_x1:
        st.plotly_chart(plot_gis_contour(terrain_attr, "Topography (DEM) Influence on Weighting", "Attribution Score", "YlOrRd"), use_container_width=True)
    with col_x2:
        st.plotly_chart(plot_gis_contour(model_attr, "Temperature Field Influence on Weighting", "Attribution Score", "YlOrRd"), use_container_width=True)

with tab_benchmark:
    st.subheader("Rigorous Model Evaluation: AI Blend vs. Single Models & Baseline")
    if "Temperature" in variable_mode:
        truth = true_temp_k - 273.15
        s1 = m1_temp_k - 273.15
        s2 = m2_temp_k - 273.15
        ens = (s1 + s2) / 2.0
        ai = b_celsius
        thresh = blender.extreme_thresh - 273.15
    else:
        truth = true_rain_mm
        s1 = m1_rain_mm
        s2 = m2_rain_mm
        ens = (s1 + s2) / 2.0
        ai = b_rain
        thresh = 35.0

    df_metrics = build_benchmark_table(truth, s1, s2, ens, ai, thresh)
    st.dataframe(df_metrics, use_container_width=True)