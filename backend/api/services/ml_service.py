import os
import numpy as np
from scipy.ndimage import zoom
from typing import Tuple, Dict, Any, Optional

from pipelines.blend_engine import OperationalBlender
from pipelines.impact_engine import DecisionIntelligenceEngine
from api.core.config import settings
from api.core.logging import logger
from api.schemas.api_schemas import (
    MLBlendRequest, MLBlendResponse, MLPointForecastResponse,
    MLAlertResponse, MLAlertItem, MLGridMetadata, MLVerificationStatus
)

_BLENDER_INSTANCE: Optional[OperationalBlender] = None
_DECISION_ENGINE_INSTANCE: Optional[DecisionIntelligenceEngine] = None
_DATA_CACHE: Dict[str, Any] = {}

LAT_RES, LON_RES = 35, 35
LATS = np.linspace(38.0, 8.0, LAT_RES)
LONS = np.linspace(68.0, 98.0, LON_RES)
LON_MESH, LAT_MESH = np.meshgrid(LONS, LATS)

DEM = 200.0 + np.exp(-((LAT_MESH - 34)**2 + (LON_MESH - 78)**2) / 30.0) * 4500.0 \
            + np.exp(-((LAT_MESH - 14)**2 + (LON_MESH - 74)**2) / 10.0) * 1800.0


def initialize_ml_service() -> Tuple[OperationalBlender, DecisionIntelligenceEngine]:
    global _BLENDER_INSTANCE, _DECISION_ENGINE_INSTANCE, _DATA_CACHE
    if _BLENDER_INSTANCE is None:
        logger.info("Initializing ML Service & loading OperationalBlender model...")
        meta_path = settings.MODEL_META_PATH
        if not os.path.isabs(meta_path):
            meta_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", meta_path)
        
        model_path = settings.MODEL_PATH
        if not os.path.isabs(model_path):
            model_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", model_path)

        _BLENDER_INSTANCE = OperationalBlender(meta_path=meta_path, model_path=model_path)
        _DECISION_ENGINE_INSTANCE = DecisionIntelligenceEngine()

        data_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "real_multivar_era5.npz")
        if os.path.exists(data_path):
            try:
                _DATA_CACHE["archive"] = np.load(data_path)
                logger.info(f"Loaded dataset archive from {data_path}")
            except Exception as e:
                logger.warning(f"Failed to load dataset archive: {e}")

    return _BLENDER_INSTANCE, _DECISION_ENGINE_INSTANCE


def get_ml_service_status() -> Dict[str, Any]:
    blender, _ = initialize_ml_service()
    return {
        "status": "ok",
        "model_loaded": blender.model_loaded if blender else False,
        "model_version": settings.MODEL_VERSION,
        "device": "cpu",
        "domain": {
            "lat_range": [float(LATS.min()), float(LATS.max())],
            "lon_range": [float(LONS.min()), float(LONS.max())],
            "resolution": [LAT_RES, LON_RES]
        }
    }


def preprocess_inputs(req: MLBlendRequest) -> Tuple[np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray]:
    if req.custom_temp_m1 is not None and req.custom_temp_m2 is not None:
        t_ifs = np.array(req.custom_temp_m1, dtype=np.float32)
        t_gc = np.array(req.custom_temp_m2, dtype=np.float32)
        r_ifs = np.zeros_like(t_ifs)
        r_gc = np.zeros_like(t_gc)
        t_obs, r_obs = t_ifs, r_ifs
        return t_ifs, t_gc, r_ifs, r_gc, t_obs, r_obs

    initialize_ml_service()
    if "archive" in _DATA_CACHE:
        arch = _DATA_CACHE["archive"]
        raw_t_truth = zoom(arch["temp_truth"][0], (LAT_RES / arch["temp_truth"][0].shape[0], LON_RES / arch["temp_truth"][0].shape[1]), order=1)
        raw_t_ifs = zoom(arch["temp_ifs"][0], (LAT_RES / arch["temp_ifs"][0].shape[0], LON_RES / arch["temp_ifs"][0].shape[1]), order=1)
        raw_r_truth = np.clip(zoom(arch["rain_truth"][0], (LAT_RES / arch["rain_truth"][0].shape[0], LON_RES / arch["rain_truth"][0].shape[1]), order=1), 0, None)
        raw_r_ifs = np.clip(zoom(arch["rain_ifs"][0], (LAT_RES / arch["rain_ifs"][0].shape[0], LON_RES / arch["rain_ifs"][0].shape[1]), order=1), 0, None)
    else:
        raw_t_truth = 300.0 - (LAT_MESH - 8.0) * 0.4 - (DEM / 1000.0) * 6.5
        raw_t_ifs = raw_t_truth + 0.5
        raw_r_truth = np.clip(np.sin((LAT_MESH - 10) / 4.0) * 45.0, 0, None)
        raw_r_ifs = raw_r_truth + 2.0

    raw_t_gc = raw_t_truth + 2.0
    raw_r_gc = raw_r_truth + 6.0
    return raw_t_ifs, raw_t_gc, raw_r_ifs, raw_r_gc, raw_t_truth, raw_r_truth


def array_to_geojson(grid_data: np.ndarray, lower_bound: np.ndarray, upper_bound: np.ndarray, var_name: str) -> Dict[str, Any]:
    features = []
    d_lat = abs(LATS[0] - LATS[1]) / 2.0
    d_lon = abs(LONS[1] - LONS[0]) / 2.0

    for i in range(len(LATS)):
        for j in range(len(LONS)):
            lat, lon = float(LATS[i]), float(LONS[j])
            feature = {
                "type": "Feature",
                "geometry": {
                    "type": "Polygon",
                    "coordinates": [[
                        [round(lon - d_lon, 4), round(lat - d_lat, 4)],
                        [round(lon + d_lon, 4), round(lat - d_lat, 4)],
                        [round(lon + d_lon, 4), round(lat + d_lat, 4)],
                        [round(lon - d_lon, 4), round(lat + d_lat, 4)],
                        [round(lon - d_lon, 4), round(lat - d_lat, 4)]
                    ]]
                },
                "properties": {
                    var_name: round(float(grid_data[i, j]), 2),
                    f"{var_name}_lower_90ci": round(float(lower_bound[i, j]), 2),
                    f"{var_name}_upper_90ci": round(float(upper_bound[i, j]), 2),
                    "lat": round(lat, 4),
                    "lon": round(lon, 4)
                }
            }
            features.append(feature)
    return {"type": "FeatureCollection", "features": features}


def predict_blend(req: MLBlendRequest) -> MLBlendResponse:
    blender, _ = initialize_ml_service()
    t_ifs, t_gc, r_ifs, r_gc, t_obs, r_obs = preprocess_inputs(req)

    (
        b_celsius, b_rain, w_t, w_r, _, _, t_bounds, r_bounds, _, rolling_rmse
    ) = blender.blend(
        t_ifs, t_gc, r_ifs, r_gc, DEM,
        obs_t=t_obs, obs_r=r_obs,
        apply_bias_correction=req.apply_bias_correction
    )

    is_temp = req.variable.lower() in ["temperature", "temp", "t"]
    grid = b_celsius if is_temp else b_rain
    bounds = t_bounds if is_temp else r_bounds
    var_label = "temperature_c" if is_temp else "rainfall_mm"

    geojson_data = array_to_geojson(grid, bounds[0], bounds[1], var_label)

    xai_geojson = None
    if req.enable_xai:
        dem_attr, _ = blender.compute_saliency(t_ifs, t_gc, r_ifs, r_gc, DEM)
        xai_geojson = array_to_geojson(dem_attr, dem_attr, dem_attr, "topography_attribution")

    return MLBlendResponse(
        status="success",
        variable=req.variable,
        lead_time_hrs=req.lead_time_hrs,
        conformal_margin=round(float(bounds[2]), 2),
        verification=MLVerificationStatus(
            rolling_rmse_m1=round(float(rolling_rmse[0]), 2),
            rolling_rmse_m2=round(float(rolling_rmse[1]), 2),
            weight_allocation_m1=round(float(np.mean(w_t[0] if is_temp else w_r[0])), 3),
            weight_allocation_m2=round(float(np.mean(w_t[1] if is_temp else w_r[1])), 3),
        ),
        grid_meta=MLGridMetadata(),
        geojson=geojson_data,
        attribution_geojson=xai_geojson
    )


def predict_point(lat: float, lon: float) -> MLPointForecastResponse:
    blender, _ = initialize_ml_service()
    req = MLBlendRequest()
    t_ifs, t_gc, r_ifs, r_gc, t_obs, r_obs = preprocess_inputs(req)

    (
        b_celsius, b_rain, w_t, w_r, _, _, t_bounds, r_bounds, _, _
    ) = blender.blend(t_ifs, t_gc, r_ifs, r_gc, DEM, obs_t=t_obs, obs_r=r_obs)

    i = int(np.argmin(np.abs(LATS - lat)))
    j = int(np.argmin(np.abs(LONS - lon)))

    elevation = float(DEM[i, j])
    primary_driver = "High Terrain Elevation (Physical Prior Dominant)" if elevation > 1500.0 else "Flat Plains Synoptic Flow (AI Dominant)"

    return MLPointForecastResponse(
        latitude=lat,
        longitude=lon,
        nearest_grid_coord=[float(LATS[i]), float(LONS[j])],
        blended_temperature_c=round(float(b_celsius[i, j]), 2),
        temperature_ci_90=[round(float(t_bounds[0][i, j]), 2), round(float(t_bounds[1][i, j]), 2)],
        blended_precipitation_mm=round(float(b_rain[i, j]), 2),
        precipitation_ci_90=[round(float(r_bounds[0][i, j]), 2), round(float(r_bounds[1][i, j]), 2)],
        model_weight_distribution={
            "ecmwf_ifs": round(float(w_t[0, i, j]), 3),
            "graphcast_ai": round(float(w_t[1, i, j]), 3)
        },
        primary_driver_feature=primary_driver
    )


def generate_alerts() -> MLAlertResponse:
    blender, decision_engine = initialize_ml_service()
    req = MLBlendRequest()
    t_ifs, t_gc, r_ifs, r_gc, t_obs, r_obs = preprocess_inputs(req)

    b_c, b_r, _, _, _, _, t_bounds, r_bounds, _, _ = blender.blend(
        t_ifs, t_gc, r_ifs, r_gc, DEM, obs_t=t_obs, obs_r=r_obs
    )

    _, _, _, df_alerts = decision_engine.evaluate_risks(b_c, b_r, t_bounds, r_bounds, DEM, LATS, LONS)

    alert_items = [
        MLAlertItem(
            node=r["Zone / Node"],
            sector=r["Sector"],
            blended_temp=r["Blended Temp"],
            blended_rain=r["Blended Rain"],
            flood_index=r["Flood Index"],
            alert_level=r["Alert Level"],
            action_directive=r["Actionable Operational Protocol"]
        )
        for _, r in df_alerts.iterrows()
    ]

    summary_counts = {
        "RED": sum(1 for a in alert_items if a.alert_level == "RED"),
        "ORANGE": sum(1 for a in alert_items if a.alert_level == "ORANGE"),
        "GREEN": sum(1 for a in alert_items if a.alert_level == "GREEN")
    }

    return MLAlertResponse(
        status="success",
        total_alerts=len(alert_items),
        summary=summary_counts,
        alerts=alert_items
    )
