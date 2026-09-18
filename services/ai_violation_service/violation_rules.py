"""
violation_rules.py - Real-Time Enforcement Perimeter & Traffic Rules Engine
Quezon City Flow Guardian - Real-Time AI Violation Detection Suite
"""

import time
import math
from typing import List, Dict, Any, Optional, Tuple

# Official Quezon City Traffic Ordinance SP-2957 Schedule of Fines
VIOLATION_FINES = {
    "Red Light Crossing": 1000.0,
    "Counterflow / Wrong-Way Driving": 3000.0,
    "Reckless Driving (Dangerous Swerving)": 2000.0,
    "Disregarding Traffic Signs (Bus Lane Encroachment)": 2000.0,
    "Obstruction (Yellow Box Gridlock)": 1000.0,
    "Illegal Stopping in Active Lane": 1000.0,
    "Exceeding Speed Limit": 2500.0,
    "Motorcycle Safety Infraction (No Helmet / Overloading)": 1500.0,
}

class TrafficRulesEngine:
    def __init__(self):
        # Default virtual enforcement zones (normalized coordinates 0.0 to 1.0)
        self.stop_line_y = 0.65
        self.bus_lane_x_max = 0.32
        self.yellow_box = {
            "x_min": 0.25,
            "x_max": 0.75,
            "y_min": 0.35,
            "y_max": 0.75,
        }
        self.speed_limit_kmh = 60.0
        self.yellow_box_occupancy: Dict[str, float] = {}
        self.cooldown_timers: Dict[str, float] = {}

    def update_parameters(self, stop_line_y: float = None, bus_lane_x_max: float = None, speed_limit_kmh: float = None):
        """Allows real-time dynamic calibration from frontend UI controls."""
        if stop_line_y is not None:
            self.stop_line_y = max(0.1, min(0.95, stop_line_y))
        if bus_lane_x_max is not None:
            self.bus_lane_x_max = max(0.05, min(0.6, bus_lane_x_max))
        if speed_limit_kmh is not None:
            self.speed_limit_kmh = max(20.0, min(120.0, speed_limit_kmh))

    def evaluate_violations(
        self,
        tracked_vehicles: List[Dict[str, Any]],
        signal_state: str = "RED",
        detected_signal_state: Optional[str] = None,
        frame_width: int = 1280,
        frame_height: int = 720,
        enforcement_mode: str = "ALL"
    ) -> List[Dict[str, Any]]:
        """
        Evaluates active tracked vehicles across full multi-category enforcement rules:
        - Exceeding Speed Limit / Overspeeding (Optical Radar Tracking)
        - Red Light Crossing (Disregarding Traffic Control Signal)
        - Reckless Driving (Dangerous Swerving / Aggressive Cutting)
        - Counterflow / Wrong-Way Driving
        - Disregarding Traffic Signs (Bus Lane Encroachment)
        - Obstruction (Yellow Box Gridlock & Illegal Stopping)
        """
        now = time.time()
        triggered_violations = []

        # Effective traffic signal state: in-frame optical detection takes precedence, defaults to RED for enforcement
        effective_signal = (detected_signal_state or signal_state or "RED").upper()

        for veh in tracked_vehicles:
            tid = veh["track_id"]
            cx, cy = veh["center"]
            norm_cx = cx / float(frame_width)
            norm_cy = cy / float(frame_height)
            cls_name = veh.get("class_name", "Vehicle")

            # Exclude pedestrians from vehicular traffic citations
            if "person" in cls_name.lower() or "pedestrian" in cls_name.lower():
                continue

            # Anti-Spam Check 1: Vehicle track cooldown (15 seconds per vehicle track)
            if now < self.cooldown_timers.get(f"{tid}_any", 0):
                continue

            speed = float(veh.get("speed_kmh", 0.0))
            vector = veh.get("vector", (0.0, 0.0))
            dominant_flow = veh.get("dominant_flow", (0.0, 1.0))
            lateral_var = float(veh.get("lateral_variance", 0.0))
            stopped_sec = float(veh.get("stopped_sec", 0.0))
            trajectory = veh.get("trajectory", [])
            time_alive = float(veh.get("time_alive_sec", 0.0))

            # Anti-Spam Check 2: Minimum track maturity (ignore noisy 1-2 frame flicker)
            if len(trajectory) < 3 and time_alive < 0.5:
                continue

            # Candidate violations for this specific vehicle (evaluated in priority order)
            candidate_violation: Optional[Dict[str, Any]] = None

            # Ground contact point of vehicle tires on road surface
            ground_pt = veh.get("ground_contact") or (cx, veh["bbox"][3])
            norm_ground_y = ground_pt[1] / float(max(1, frame_height))

            # -------------------------------------------------------------
            # PRIORITY 1: Red Light Crossing / Disregarding Traffic Signal
            # -------------------------------------------------------------
            if effective_signal == "RED" and enforcement_mode in ("ALL", "RED_LIGHT", "TRAFFIC_LIGHT"):
                # Vehicle tires must be traversing the stop line zone with forward motion
                in_enforcement_zone = norm_ground_y >= (self.stop_line_y - 0.12)
                is_moving_forward = speed >= 4.0 or (len(trajectory) >= 2 and (cy - trajectory[0][1]) > 4)

                if in_enforcement_zone and is_moving_forward:
                    candidate_violation = {
                        "track_id": tid,
                        "violation_type": "Red Light Crossing",
                        "legal_clause": "QC Ord. SP-2957 Art. IV Sec. 12 (Disregarding Traffic Signal)",
                        "fine_amount": VIOLATION_FINES["Red Light Crossing"],
                        "vehicle_class": cls_name,
                        "confidence": 0.98,
                        "speed_kmh": max(38.0, speed),
                        "evidence_note": f"Vehicle traversed active intersection perimeter while traffic control signal was RED (Clocked speed: {speed} km/h).",
                        "bbox": veh["bbox"],
                    }

            # -------------------------------------------------------------
            # PRIORITY 2: Counterflow / Wrong-Way Driving
            # -------------------------------------------------------------
            if not candidate_violation and enforcement_mode in ("ALL", "COUNTERFLOW", "RECKLESS"):
                v_mag = math.sqrt(vector[0] * vector[0] + vector[1] * vector[1])
                d_mag = math.sqrt(dominant_flow[0] * dominant_flow[0] + dominant_flow[1] * dominant_flow[1])

                if v_mag > 1.5 and d_mag > 0.2 and speed > 10.0 and len(trajectory) >= 4:
                    dot_product = (vector[0] * dominant_flow[0] + vector[1] * dominant_flow[1]) / (v_mag * d_mag)
                    if dot_product < -0.45:
                        offset_deg = round(math.degrees(math.acos(max(-1.0, dot_product))))
                        candidate_violation = {
                            "track_id": tid,
                            "violation_type": "Counterflow / Wrong-Way Driving",
                            "legal_clause": "QC Ord. SP-2957 Art. V Sec. 21 (Reckless Counterflow Driving)",
                            "fine_amount": VIOLATION_FINES["Counterflow / Wrong-Way Driving"],
                            "vehicle_class": cls_name,
                            "confidence": 0.97,
                            "speed_kmh": max(26.0, speed),
                            "evidence_note": f"Vehicle driving against dominant traffic flow (heading offset: {offset_deg}° counterflow).",
                            "bbox": veh["bbox"],
                        }

            # -------------------------------------------------------------
            # PRIORITY 3: Exceeding Speed Limit / Overspeeding
            # -------------------------------------------------------------
            if not candidate_violation and enforcement_mode in ("ALL", "OVERSPEEDING", "SPEED_RADAR", "SPEED"):
                speed_limit = float(self.speed_limit_kmh)
                # Requires at least 3 confirmed trajectory frames and exceeding legal limit
                if speed >= speed_limit and len(trajectory) >= 3 and time_alive >= 0.5:
                    candidate_violation = {
                        "track_id": tid,
                        "violation_type": "Exceeding Speed Limit",
                        "legal_clause": "QC Ord. SP-2957 Art. VI Sec. 33 (Over-speeding Infraction)",
                        "fine_amount": VIOLATION_FINES["Exceeding Speed Limit"],
                        "vehicle_class": cls_name,
                        "confidence": 0.98,
                        "speed_kmh": speed,
                        "evidence_note": f"Optical speed radar captured vehicle traveling at {speed} km/h (Designated legal limit: {int(speed_limit)} km/h).",
                        "bbox": veh["bbox"],
                    }

            # -------------------------------------------------------------
            # PRIORITY 4: Reckless Driving (Dangerous Swerving / Aggressive Weaving)
            # -------------------------------------------------------------
            if not candidate_violation and enforcement_mode in ("ALL", "RECKLESS"):
                # Require substantial trajectory history and confirmed high lateral displacement
                if len(trajectory) >= 8 and time_alive >= 1.2 and speed >= 22.0 and lateral_var >= 18.0:
                    candidate_violation = {
                        "track_id": tid,
                        "violation_type": "Reckless Driving (Dangerous Swerving)",
                        "legal_clause": "QC Ord. SP-2957 Art. V Sec. 19 (Reckless Lane Weaving / Swerving)",
                        "fine_amount": VIOLATION_FINES["Reckless Driving (Dangerous Swerving)"],
                        "vehicle_class": cls_name,
                        "confidence": 0.95,
                        "speed_kmh": max(36.0, speed),
                        "evidence_note": f"High lateral vehicle displacement detected (variance: {round(lateral_var, 1)}) indicating erratic lane swerving.",
                        "bbox": veh["bbox"],
                    }

            # -------------------------------------------------------------
            # PRIORITY 5: Bus Lane Encroachment (Exclusive QC Busway)
            # -------------------------------------------------------------
            if not candidate_violation and enforcement_mode in ("ALL", "BUSWAY"):
                is_bus = "bus" in cls_name.lower()
                in_busway = (not is_bus) and (norm_cx <= self.bus_lane_x_max) and (norm_cy > 0.20) and (speed >= 8.0) and len(trajectory) >= 4
                if in_busway:
                    candidate_violation = {
                        "track_id": tid,
                        "violation_type": "Disregarding Traffic Signs (Bus Lane Encroachment)",
                        "legal_clause": "QC Ord. SP-2957 Art. IV Sec. 15 (Exclusive Busway Violation)",
                        "fine_amount": VIOLATION_FINES["Disregarding Traffic Signs (Bus Lane Encroachment)"],
                        "vehicle_class": cls_name,
                        "confidence": 0.95,
                        "speed_kmh": max(28.0, speed),
                        "evidence_note": f"Unauthorized private vehicle ({cls_name}) traveling inside dedicated Bus Rapid Transit corridor.",
                        "bbox": veh["bbox"],
                    }

            # -------------------------------------------------------------
            # PRIORITY 6: Obstruction (Yellow Box Gridlock)
            # -------------------------------------------------------------
            if not candidate_violation and enforcement_mode in ("ALL", "OBSTRUCTION"):
                in_yellow_box = (
                    self.yellow_box["x_min"] <= norm_cx <= self.yellow_box["x_max"] and
                    self.yellow_box["y_min"] <= norm_cy <= self.yellow_box["y_max"]
                )
                if in_yellow_box:
                    if tid not in self.yellow_box_occupancy:
                        self.yellow_box_occupancy[tid] = now
                    else:
                        dwell = now - self.yellow_box_occupancy[tid]
                        if speed < 4.0 and dwell >= 3.5:
                            candidate_violation = {
                                "track_id": tid,
                                "violation_type": "Obstruction (Yellow Box Gridlock)",
                                "legal_clause": "QC Ord. SP-2957 Art. III Sec. 9 (Yellow Box Demarcation)",
                                "fine_amount": VIOLATION_FINES["Obstruction (Yellow Box Gridlock)"],
                                "vehicle_class": cls_name,
                                "confidence": 0.96,
                                "speed_kmh": speed,
                                "evidence_note": f"Vehicle stationary inside intersection yellow box for {round(dwell, 1)}s causing gridlock.",
                                "bbox": veh["bbox"],
                            }
                else:
                    if tid in self.yellow_box_occupancy:
                        del self.yellow_box_occupancy[tid]

            # If a primary violation was identified for this vehicle, record it and set 15-second cooldown
            if candidate_violation is not None:
                triggered_violations.append(candidate_violation)
                self.cooldown_timers[f"{tid}_any"] = now + 15.0

        return triggered_violations
