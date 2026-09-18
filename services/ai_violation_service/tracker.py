"""
tracker.py - Real-Time Multi-Object Vehicle Tracking & Velocity Estimation
Quezon City Flow Guardian - Real-Time AI Violation Detection Suite
"""

import math
import time
import numpy as np
from typing import List, Dict, Any, Tuple

class TrackedVehicle:
    def __init__(self, track_id: int, bbox: List[int], class_name: str, confidence: float):
        self.track_id = track_id
        self.bbox = bbox  # [x1, y1, x2, y2]
        self.class_name = class_name
        self.confidence = confidence
        self.history: List[Tuple[int, int, float]] = []  # [(cx, cy, timestamp), ...]
        self.ground_history: List[Tuple[int, int, float]] = []  # [(cx, y2, timestamp), ...] - Road contact points
        self.speed_kmh: float = 0.0
        self.vector: Tuple[float, float] = (0.0, 0.0)  # (dx, dy)
        self.heading_deg: float = 0.0
        self.lateral_variance: float = 0.0
        self.stopped_duration_sec: float = 0.0
        self.missed_frames: int = 0
        self.created_at: float = time.time()
        self.last_seen: float = time.time()
        self.locked_plate: Optional[str] = None
        self.locked_model: Optional[str] = None
        self.consecutive_speeding_frames: int = 0

        cx = int((bbox[0] + bbox[2]) / 2)
        cy = int((bbox[1] + bbox[3]) / 2)
        ground_y = int(bbox[3])
        self.history.append((cx, cy, self.last_seen))
        self.ground_history.append((cx, ground_y, self.last_seen))

    @property
    def center(self) -> Tuple[int, int]:
        return int((self.bbox[0] + self.bbox[2]) / 2), int((self.bbox[1] + self.bbox[3]) / 2)

    @property
    def ground_contact(self) -> Tuple[int, int]:
        """Tire / road surface contact point for scale-invariant perspective velocity."""
        return int((self.bbox[0] + self.bbox[2]) / 2), int(self.bbox[3])

    def update(self, bbox: List[int], confidence: float, class_name: str = None):
        now = time.time()
        self.bbox = bbox
        self.confidence = confidence
        if class_name and not self.locked_model:
            self.class_name = class_name
        self.missed_frames = 0
        self.last_seen = now

        cx, cy = self.center
        ground_y = int(self.bbox[3])
        self.history.append((cx, cy, now))
        self.ground_history.append((cx, ground_y, now))
        if len(self.history) > 30:
            self.history.pop(0)
        if len(self.ground_history) > 30:
            self.ground_history.pop(0)

        # Calculate optical velocity, trajectory vector, and heading
        self._calculate_motion()

    def _calculate_motion(self):
        """
        Calculates optical speed in km/h and directional motion vector using:
        1. Ground-plane tire contact points (cx, y2) rather than box centers to avoid perspective dilation distortion.
        2. Moving-window median smoothing across recent frames to filter out bounding box jitter.
        3. Camera tilt perspective foreshortening compensation calibrated to vehicle vertical position.
        """
        if len(self.ground_history) < 2:
            self.speed_kmh = 0.0
            return

        # Take points from recent ground contact frames
        p_prev = self.ground_history[-3] if len(self.ground_history) >= 3 else self.ground_history[-2]
        p_curr = self.ground_history[-1]
        dt = p_curr[2] - p_prev[2]
        if dt <= 0.001:
            return

        # Moving median smoothing over last 5 points to eliminate single-frame YOLO jitter
        recent_pts = self.ground_history[-5:] if len(self.ground_history) >= 5 else self.ground_history
        smooth_dx = float(np.median([pt[0] for pt in recent_pts[-2:]]) - np.median([pt[0] for pt in recent_pts[:2]]))
        smooth_dy = float(np.median([pt[1] for pt in recent_pts[-2:]]) - np.median([pt[1] for pt in recent_pts[:2]]))
        
        # Raw delta for heading
        raw_dx = p_curr[0] - p_prev[0]
        raw_dy = p_curr[1] - p_prev[1]
        self.vector = (smooth_dx, smooth_dy)

        # Heading in degrees (0 = right, 90 = down, 180 = left, 270 = up)
        rad = math.atan2(raw_dy, raw_dx)
        self.heading_deg = (math.degrees(rad) + 360) % 360

        pixel_dist = math.sqrt(smooth_dx * smooth_dx + smooth_dy * smooth_dy)

        # Scale-invariant physical velocity:
        # Standard motor vehicle characteristic dimension in meters (pickup / SUV ~ 4.8m, sedan ~ 4.4m)
        box_w = max(1, self.bbox[2] - self.bbox[0])
        box_h = max(1, self.bbox[3] - self.bbox[1])
        is_vertical_motion = abs(smooth_dy) >= abs(smooth_dx)
        box_ref_pixels = max(35.0, float(box_h if is_vertical_motion else box_w))

        # Vehicle lengths traversed per second
        lengths_per_sec = (pixel_dist / box_ref_pixels) / dt

        # Camera tilt perspective depth calibration:
        # Vehicles near top (distant, small y) cover fewer pixels per meter than near bottom (foreground, large y)
        norm_y = min(1.0, max(0.1, float(self.bbox[3]) / 720.0))
        perspective_depth_scale = 0.90 + (1.20 * norm_y)
        axis_factor = 2.1 if is_vertical_motion else 1.25

        calculated_speed = lengths_per_sec * 4.8 * 3.6 * axis_factor * perspective_depth_scale

        # Apply stable Exponential Moving Average (EMA) (40% new + 60% historical)
        if self.speed_kmh <= 0.0:
            self.speed_kmh = round(min(160.0, max(0.0, calculated_speed)), 1)
        else:
            smoothed = (0.40 * calculated_speed) + (0.60 * self.speed_kmh)
            self.speed_kmh = round(min(160.0, max(0.0, smoothed)), 1)

        # Calculate stopped duration
        if self.speed_kmh < 4.0:
            self.stopped_duration_sec += dt
        else:
            self.stopped_duration_sec = 0.0

        # Lateral variance (detects erratic swerving across traffic lanes)
        if len(self.history) >= 4:
            xs = [pt[0] for pt in self.history[-8:]]
            self.lateral_variance = float(np.std(xs))


def _compute_box_iou(boxA: List[int], boxB: List[int]) -> float:
    """Computes Intersection over Union (IoU) between two bounding boxes [x1, y1, x2, y2]."""
    xA = max(boxA[0], boxB[0])
    yA = max(boxA[1], boxB[1])
    xB = min(boxA[2], boxB[2])
    yB = min(boxA[3], boxB[3])
    interW = max(0, xB - xA)
    interH = max(0, yB - yA)
    interArea = interW * interH
    if interArea <= 0:
        return 0.0
    areaA = max(1, (boxA[2] - boxA[0]) * (boxA[3] - boxA[1]))
    areaB = max(1, (boxB[2] - boxB[0]) * (boxB[3] - boxB[1]))
    return float(interArea) / float(areaA + areaB - interArea)


class VehicleTracker:
    def __init__(self, iou_dist_threshold: float = 120.0, max_age: int = 30):
        self.tracks: Dict[int, TrackedVehicle] = {}
        self.next_id: int = 101
        self.dist_threshold = iou_dist_threshold
        self.max_age = max_age
        self.dominant_flow_vector: Tuple[float, float] = (0.0, 1.0)  # Default downward flow

    def update(self, detections: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        """
        Associates detections to existing tracks using IoU overlap + Euclidean distance on centers.
        Calculates dominant flow direction and returns tracked objects.
        """
        # Increment missed frames
        for trk in self.tracks.values():
            trk.missed_frames += 1

        unmatched_detections = list(range(len(detections)))
        matched_track_ids = set()

        if len(self.tracks) > 0 and len(detections) > 0:
            # Score each candidate (detection_idx, track_id) pair
            candidates = []
            for d_idx, det in enumerate(detections):
                d_box = det["bbox"]
                d_center = det.get("center") or [int((d_box[0] + d_box[2]) / 2), int((d_box[1] + d_box[3]) / 2)]
                det_w = max(1, d_box[2] - d_box[0])
                det_h = max(1, d_box[3] - d_box[1])
                adaptive_dist_max = max(self.dist_threshold, max(det_w, det_h) * 1.1)

                for trk_id, trk in self.tracks.items():
                    t_center = trk.center
                    dist = math.sqrt((d_center[0] - t_center[0]) ** 2 + (d_center[1] - t_center[1]) ** 2)
                    iou = _compute_box_iou(d_box, trk.bbox)

                    # Either significant IoU overlap OR within spatial proximity threshold
                    if iou >= 0.12 or dist < adaptive_dist_max:
                        # Combined matching cost: lower is better
                        cost = (1.0 - iou) * 100.0 + (dist / 2.0)
                        candidates.append((cost, d_idx, trk_id))

            # Sort by best matches first
            candidates.sort(key=lambda x: x[0])
            for cost, d_idx, trk_id in candidates:
                if d_idx in unmatched_detections and trk_id not in matched_track_ids:
                    det = detections[d_idx]
                    self.tracks[trk_id].update(
                        det["bbox"], det["confidence"], det.get("class_name")
                    )
                    matched_track_ids.add(trk_id)
                    unmatched_detections.remove(d_idx)

        # Create new tracks for unmatched detections
        for d_idx in unmatched_detections:
            det = detections[d_idx]
            new_trk = TrackedVehicle(
                track_id=self.next_id,
                bbox=det["bbox"],
                class_name=det.get("class_name", "Vehicle"),
                confidence=det["confidence"]
            )
            self.tracks[self.next_id] = new_trk
            self.next_id += 1
            if self.next_id > 9999:
                self.next_id = 101

        # Delete expired tracks
        dead_ids = [tid for tid, trk in self.tracks.items() if trk.missed_frames > self.max_age]
        for tid in dead_ids:
            del self.tracks[tid]

        # Calculate dominant traffic flow vector from moving vehicles
        moving_vectors = [trk.vector for trk in self.tracks.values() if trk.speed_kmh > 10.0]
        if len(moving_vectors) >= 2:
            avg_dx = sum(v[0] for v in moving_vectors) / len(moving_vectors)
            avg_dy = sum(v[1] for v in moving_vectors) / len(moving_vectors)
            mag = math.sqrt(avg_dx * avg_dx + avg_dy * avg_dy)
            if mag > 1.0:
                self.dominant_flow_vector = (avg_dx / mag, avg_dy / mag)

        # Format output
        results = []
        for tid, trk in self.tracks.items():
            if trk.missed_frames == 0:
                results.append({
                    "track_id": f"TRK-{trk.track_id}",
                    "bbox": trk.bbox,
                    "center": trk.center,
                    "ground_contact": trk.ground_contact,
                    "class_name": trk.class_name,
                    "confidence": trk.confidence,
                    "speed_kmh": trk.speed_kmh,
                    "vector": trk.vector,
                    "heading_deg": round(trk.heading_deg, 1),
                    "lateral_variance": round(trk.lateral_variance, 1),
                    "stopped_sec": round(trk.stopped_duration_sec, 1),
                    "dominant_flow": self.dominant_flow_vector,
                    "trajectory": [(pt[0], pt[1]) for pt in trk.history[-12:]],
                    "ground_trajectory": [(pt[0], pt[1]) for pt in trk.ground_history[-12:]],
                    "time_alive_sec": round(time.time() - trk.created_at, 1)
                })

        return results
