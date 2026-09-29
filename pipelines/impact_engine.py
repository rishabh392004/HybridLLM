import numpy as np
import pandas as pd

class DecisionIntelligenceEngine:
    def __init__(self):
        # Major synoptic reference nodes across the Indian domain
        self.reference_cities = [
            {"name": "New Delhi / NCR", "lat": 28.61, "lon": 77.20, "sector": "Urban Infrastructure"},
            {"name": "Dehradun (Himalayan Foothills)", "lat": 30.31, "lon": 78.03, "sector": "Mountain Hydrology"},
            {"name": "Shimla (High Topography)", "lat": 31.10, "lon": 77.17, "sector": "Disaster Management"},
            {"name": "Patna (Gangetic Basin)", "lat": 25.59, "lon": 85.13, "sector": "Agriculture & Flood"},
            {"name": "Mumbai / Konkan Coast", "lat": 19.07, "lon": 72.87, "sector": "Coastal Megacity"},
            {"name": "Ahmedabad", "lat": 23.02, "lon": 72.57, "sector": "Renewable Solar Corridor"},
            {"name": "Bengaluru", "lat": 12.97, "lon": 77.59, "sector": "Urban Logistics"},
            {"name": "Nagpur (Central India)", "lat": 21.14, "lon": 79.08, "sector": "Cotton/Soy Agriculture"},
            {"name": "Guwahati (Brahmaputra)", "lat": 26.14, "lon": 91.73, "sector": "Riverine Flood Basin"}
        ]

    def compute_terrain_slope(self, dem_grid, lats, lons):
        """Calculates topographic gradient norm (steepness in m/km)."""
        dy, dx = np.gradient(dem_grid)
        # Approximate scaling factor per grid step
        d_lat_km = abs(lats[0] - lats[1]) * 111.0
        d_lon_km = abs(lons[1] - lons[0]) * 105.0
        slope = np.sqrt((dy / d_lat_km)**2 + (dx / d_lon_km)**2)
        return slope

    def evaluate_risks(self, blended_temp, blended_rain, temp_bounds, rain_bounds, dem_grid, lats, lons):
        """Computes spatial risk fields and point-level actionable alerts."""
        t_low = temp_bounds[0]
        t_high = temp_bounds[1]
        r_high = rain_bounds[1]
        slope = self.compute_terrain_slope(dem_grid, lats, lons)

        # 1. Flash Flood & Landslide Susceptibility Index (0 to 100)
        # Combines blended rainfall and terrain slope
        raw_flood_index = (blended_rain / 50.0) * (1.0 + (slope / 15.0))
        flash_flood_hazard = np.clip(raw_flood_index * 35.0, 0.0, 100.0)

        # 2. Agricultural Thermal Stress Field
        # Categorical: -1 = Frost Risk, 0 = Nominal, 1 = Moderate Heat, 2 = Severe Heatwave
        thermal_stress = np.zeros_like(blended_temp)
        thermal_stress[t_low <= 4.0] = -1.0
        thermal_stress[(t_high >= 38.0) & (t_high < 42.0)] = 1.0
        thermal_stress[t_high >= 42.0] = 2.0

        # 3. Renewable Grid Impact (Estimated Solar Reduction % based on rain clouds)
        solar_curtailment_risk = np.clip((blended_rain / 40.0) * 85.0, 0.0, 95.0)

        # 4. Generate Actionable Municipal/Regional Warning Table
        alerts = []
        for city in self.reference_cities:
            # Nearest coordinate neighbor
            i = int(np.argmin(np.abs(lats - city["lat"])))
            j = int(np.argmin(np.abs(lons - city["lon"])))

            c_temp = float(blended_temp[i, j])
            c_rain = float(blended_rain[i, j])
            c_flood = float(flash_flood_hazard[i, j])
            c_t_high = float(t_high[i, j])
            c_t_low = float(t_low[i, j])

            severity = "GREEN"
            action = "Routine operational monitoring."

            if c_flood >= 65.0:
                severity = "RED"
                action = f"High Flash Flood / Debris Flow Warning ({c_rain:.1f} mm/day on steep terrain). Alert NDRF / SDRF units."
            elif c_flood >= 40.0:
                severity = "ORANGE"
                action = f"Moderate runoff risk ({c_rain:.1f} mm/day). Clear municipal storm drainage culverts."
            elif c_t_high >= 42.0:
                severity = "RED"
                action = f"Severe Heatwave Alert (Upper bound {c_t_high:.1f} °C). Issue power grid peak load warnings."
            elif c_t_low <= 4.0:
                severity = "ORANGE"
                action = f"Agricultural Frost Hazard (Lower bound {c_t_low:.1f} °C). Issue crop irrigation advisories."

            alerts.append({
                "Zone / Node": city["name"],
                "Sector": city["sector"],
                "Blended Temp": f"{c_temp:.1f} °C",
                "Blended Rain": f"{c_rain:.1f} mm",
                "Flood Index": round(c_flood, 1),
                "Alert Level": severity,
                "Actionable Operational Protocol": action
            })

        df_alerts = pd.DataFrame(alerts)
        return flash_flood_hazard, thermal_stress, solar_curtailment_risk, df_alerts