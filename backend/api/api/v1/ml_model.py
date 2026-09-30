from fastapi import APIRouter, HTTPException, Query
from scipy.ndimage import zoom
import numpy as np
import os
import sys

from pipelines.blend_engine import OperationalBlender
from pipelines.impact_engine import DecisionIntelligenceEngine
from pipelines.copilot_enigne import OperationalCopilot
from api.schemas.api_schemas import (
    MLBlendRequest, MLBlendResponse, MLPointForecastResponse, 
    MLAlertResponse, MLAlertItem, MLGridMetadata, MLVerificationStatus,
    CopilotQueryRequest, CopilotQueryResponse
)

router = APIRouter()

BLENDER = None
DECISION_ENGINE = None
COPILOT = None
DATA_CACHE = {}

LAT_RES, LON_RES = 35, 35
LATS = np.linspace(38.0, 8.0, LAT_RES)
LONS = np.linspace(68.0, 98.0, LON_RES)
LON_MESH, LAT_MESH = np.meshgrid(LONS, LATS)

DEM = 200.0 + np.exp(-((LAT_MESH - 34)**2 + (LON_MESH - 78)**2) / 30.0) * 4500.0 \
            + np.exp(-((LAT_MESH - 14)**2 + (LON_MESH - 74)**2) / 10.0) * 1800.0

# In a real app we'd load this on startup (like the team did).
# We can initialize it lazily or use a router lifecycle event.
def get_ml_models():
    global BLENDER, DECISION_ENGINE, COPILOT, DATA_CACHE
    if BLENDER is None:
        meta_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "models", "model_metadata.json")
        BLENDER = OperationalBlender(meta_path=meta_path)
        DECISION_ENGINE = DecisionIntelligenceEngine()
        COPILOT = OperationalCopilot(BLENDER, DECISION_ENGINE)

        data_path = os.path.join(os.path.dirname(__file__), "..", "..", "..", "data", "real_multivar_era5.npz")
        if os.path.exists(data_path):
            DATA_CACHE["archive"] = np.load(data_path)
    return BLENDER, DECISION_ENGINE, DATA_CACHE

def get_copilot():
    global COPILOT
    if COPILOT is None:
        get_ml_models()
    return COPILOT

def get_base_inputs():
    BLENDER, DECISION_ENGINE, DATA_CACHE = get_ml_models()
    if "archive" in DATA_CACHE:
        arch = DATA_CACHE["archive"]
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

def array_to_geojson(grid_data, lower_bound, upper_bound, var_name):
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


@router.post("/blend", response_model=MLBlendResponse, tags=["ML Inference"])
def blend_forecast(req: MLBlendRequest):
    try:
        t_ifs, t_gc, r_ifs, r_gc, t_obs, r_obs = get_base_inputs()

        (
            b_celsius, b_rain, w_t, w_r, _, _, t_bounds, r_bounds, _, rolling_rmse
        ) = BLENDER.blend(
        t_ifs, t_gc, r_ifs, r_gc, DEM,
            obs_t=t_obs, obs_r=r_obs,
            apply_bias_correction=req.apply_bias_correction
        )

        is_temp = req.variable.lower() == "temperature"
        grid = b_celsius if is_temp else b_rain
        bounds = t_bounds if is_temp else r_bounds
        var_label = "temperature_c" if is_temp else "rainfall_mm"

        geojson_data = array_to_geojson(grid, bounds[0], bounds[1], var_label)

        xai_geojson = None
        if req.enable_xai:
            dem_attr, _ = BLENDER.compute_saliency(t_ifs, t_gc, r_ifs, r_gc, DEM)
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


    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast/point", response_model=MLPointForecastResponse, tags=["ML Inference"])
def point_forecast(lat: float = Query(..., ge=8.0, le=38.0), lon: float = Query(..., ge=68.0, le=98.0)):
    try:
        t_ifs, t_gc, r_ifs, r_gc, t_obs, r_obs = get_base_inputs()

        (
            b_celsius, b_rain, w_t, w_r, _, _, t_bounds, r_bounds, _, _
        ) = BLENDER.blend(t_ifs, t_gc, r_ifs, r_gc, DEM, obs_t=t_obs, obs_r=r_obs)

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


    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/alerts", response_model=MLAlertResponse, tags=["ML Decision Intelligence"])
def get_alerts():
    try:
        BLENDER, DECISION_ENGINE, DATA_CACHE = get_ml_models()
        t_ifs, t_gc, r_ifs, r_gc, t_obs, r_obs = get_base_inputs()

        b_c, b_r, _, _, _, _, t_bounds, r_bounds, _, _ = BLENDER.blend(
            t_ifs, t_gc, r_ifs, r_gc, DEM, obs_t=t_obs, obs_r=r_obs
        )

        _, _, _, df_alerts = DECISION_ENGINE.evaluate_risks(b_c, b_r, t_bounds, r_bounds, DEM, LATS, LONS)

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
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/copilot/query", response_model=CopilotQueryResponse, tags=["Operational Copilot"])
def copilot_briefing(req: CopilotQueryRequest):
    try:
        BLENDER, DECISION_ENGINE, DATA_CACHE = get_ml_models()
        copilot = get_copilot()
        t_ifs, t_gc, r_ifs, r_gc, t_obs, r_obs = get_base_inputs()

        (
            b_celsius, b_rain, _, _, _, _, t_bounds, r_bounds, _, rolling_rmse
        ) = BLENDER.blend(t_ifs, t_gc, r_ifs, r_gc, DEM, obs_t=t_obs, obs_r=r_obs)

        res = copilot.query(
            req.query, b_celsius, b_rain, t_bounds, r_bounds, DEM, LATS, LONS, rolling_rmse
        )

        return CopilotQueryResponse(
            status="success",
            query=req.query,
            severity=res["severity"],
            summary=res["summary"],
            actionable_directives=res["actionable_directives"],
            targeted_nodes=res["targeted_nodes"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

