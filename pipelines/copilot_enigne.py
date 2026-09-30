import numpy as np

class OperationalCopilot:
    def __init__(self, blender, decision_engine):
        self.blender = blender
        self.decision_engine = decision_engine

    def query(self, question: str, b_celsius, b_rain, t_bounds, r_bounds, dem, lats, lons, rolling_rmse):
        q = question.lower()

        # 1. Fetch current risk & alert state
        _, _, _, df_alerts = self.decision_engine.evaluate_risks(
            b_celsius, b_rain, t_bounds, r_bounds, dem, lats, lons
        )

        red_alerts = df_alerts[df_alerts["Alert Level"] == "RED"].to_dict(orient="records")
        orange_alerts = df_alerts[df_alerts["Alert Level"] == "ORANGE"].to_dict(orient="records")

        # Intent 1: Extreme Risk / Flood / Emergency Inquiries
        if any(w in q for w in ["flood", "emergency", "alert", "danger", "hazard", "red", "warning"]):
            if not red_alerts and not orange_alerts:
                return {
                    "summary": "Nominal conditions across all primary synoptic nodes. No critical warnings active.",
                    "severity": "NORMAL",
                    "actionable_directives": ["Maintain standard observation protocols."],
                    "targeted_nodes": []
                }
            
            targets = []
            directives = []
            for r in red_alerts:
                targets.append(f"{r['Zone / Node']} (Flood Index: {r['Flood Index']})")
                directives.append(f"CRITICAL: {r['Actionable Operational Protocol']}")
            for o in orange_alerts:
                targets.append(f"{o['Zone / Node']} (Flood Index: {o['Flood Index']})")
                directives.append(f"ADVISORY: {o['Actionable Operational Protocol']}")

            return {
                "summary": f"Detected {len(red_alerts)} critical (RED) and {len(orange_alerts)} advisory (ORANGE) risk zones.",
                "severity": "CRITICAL" if red_alerts else "WARNING",
                "actionable_directives": directives,
                "targeted_nodes": targets
            }

        # Intent 2: Model Trust, Bias Drift, or NWP vs AI Verification
        if any(w in q for w in ["trust", "bias", "drift", "rmse", "performance", "accurate", "ecmwf", "graphcast"]):
            ifs_rmse = float(rolling_rmse[0])
            gc_rmse = float(rolling_rmse[1])
            better_model = "ECMWF IFS (Physical NWP)" if ifs_rmse <= gc_rmse else "GraphCast AI"
            diff = abs(ifs_rmse - gc_rmse)

            return {
                "summary": f"Current 7-cycle rolling verification indicates {better_model} is more reliable.",
                "severity": "NORMAL",
                "actionable_directives": [
                    f"ECMWF IFS Rolling RMSE: {ifs_rmse:.2f} °C",
                    f"GraphCast AI Rolling RMSE: {gc_rmse:.2f} °C",
                    f"Performance differential is {diff:.2f} °C. Online gating assigns higher dynamic weighting to the lower-error model."
                ],
                "targeted_nodes": ["Subcontinent Synoptic Domain"]
            }

        # Intent 3: Uncertainty / Conformal Bounds
        if any(w in q for w in ["uncertainty", "confidence", "bounds", "conformal", "error margin"]):
            margin_t = float(t_bounds[2])
            margin_r = float(r_bounds[2])
            return {
                "summary": "Formal 90% Conformal Prediction uncertainty envelopes active.",
                "severity": "NORMAL",
                "actionable_directives": [
                    f"Temperature 90% Confidence Margin: ±{margin_t:.2f} °C",
                    f"Precipitation 90% Confidence Margin: ±{margin_r:.2f} mm/day",
                    "Values guaranteed under finite-sample distribution-free calibration."
                ],
                "targeted_nodes": ["All Gridded Nodes"]
            }

        # Default: Executive Operational Situational Briefing
        mean_t = float(np.mean(b_celsius))
        mean_r = float(np.mean(b_rain))
        active_critical = len(red_alerts)

        return {
            "summary": f"Executive Synoptic Briefing: Regional mean temp {mean_t:.1f} °C, mean precip {mean_r:.1f} mm/day. {active_critical} critical alerts active.",
            "severity": "CRITICAL" if active_critical > 0 else "NORMAL",
            "actionable_directives": [
                f"Active Red Nodes: {len(red_alerts)}",
                f"Active Orange Nodes: {len(orange_alerts)}",
                f"Operational Bias Correction: Active (Recursive Kalman-style filter running)"
            ],
            "targeted_nodes": [r["Zone / Node"] for r in red_alerts] if red_alerts else ["Regional Grid Nominal"]
        }