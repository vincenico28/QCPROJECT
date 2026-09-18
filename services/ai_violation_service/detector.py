"""
detector.py - YOLOv8 and OpenCV Vehicle & Object Detection Engine
Quezon City Flow Guardian - Real-Time AI Violation Detection Suite
"""

import os
import cv2
import numpy as np
from typing import List, Dict, Any, Tuple, Optional

# Mapping of COCO class indices to traffic vehicle & infrastructure classes
# 0: person, 1: bicycle, 2: car, 3: motorcycle, 5: bus, 7: truck, 9: traffic light
TRAFFIC_CLASSES = {
    0: "Person / Pedestrian",
    1: "Bicycle / E-Trike",
    2: "Private Sedan / SUV",
    3: "Motorcycle",
    5: "Public Bus Transit",
    7: "Heavy Truck / Delivery",
    9: "Traffic Light",
}

class YoloTrafficDetector:
    def __init__(self, model_name: str = "yolov8n.pt", conf_thresh: float = 0.30, iou_thresh: float = 0.45):
        self.conf_thresh = conf_thresh
        self.iou_thresh = iou_thresh
        self.model_name = model_name
        self.model = None
        self.is_yolo_available = False

        self._init_detector()

    def _init_detector(self):
        """Initializes Ultralytics YOLOv8 with graceful fallback to OpenCV Haar / HOG if needed."""
        cv2.setUseOptimized(True)
        try:
            import torch
            torch.set_num_threads(4)
        except Exception:
            pass

        try:
            from ultralytics import YOLO
            print(f"[YOLO Detector] Loading Ultralytics YOLO model: {self.model_name}...")
            self.model = YOLO(self.model_name)
            self.is_yolo_available = True
            print(f"[YOLO Detector] YOLO model {self.model_name} loaded successfully!")
        except Exception as e:
            print(f"[YOLO Detector] Ultralytics initialization warning: {e}. Using OpenCV optical fallback.")
            self.is_yolo_available = False

    def detect(self, frame: np.ndarray) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Runs object detection on a BGR frame.
        Returns:
            (detections, detected_signal_state)
            where detected_signal_state is "RED", "YELLOW", "GREEN", or None if no light is detected.
        """
        if frame is None or frame.size == 0:
            return [], None

        h, w = frame.shape[:2]
        detections: List[Dict[str, Any]] = []
        detected_signal_state: Optional[str] = None

        if self.is_yolo_available and self.model is not None:
            try:
                import torch
                # Run YOLO inference with inference_mode on traffic vehicles & traffic lights (0, 1, 2, 3, 5, 7, 9)
                with torch.inference_mode():
                    results = self.model(
                        frame,
                        imgsz=480,
                        conf=self.conf_thresh,
                        iou=self.iou_thresh,
                        classes=[0, 1, 2, 3, 5, 7, 9],
                        verbose=False
                    )

                for r in results:
                    boxes = r.boxes
                    if boxes is None or len(boxes) == 0:
                        continue

                    for box in boxes:
                        coords = box.xyxy[0].cpu().numpy()
                        x1, y1, x2, y2 = [int(v) for v in coords]
                        conf = float(box.conf[0].cpu().numpy())
                        cls_id = int(box.cls[0].cpu().numpy())

                        # Clamp coordinates to frame boundaries
                        x1 = max(0, min(w - 1, x1))
                        y1 = max(0, min(h - 1, y1))
                        x2 = max(0, min(w - 1, x2))
                        y2 = max(0, min(h - 1, y2))

                        box_w = x2 - x1
                        box_h = y2 - y1
                        if box_w < 10 or box_h < 10:
                            continue

                        cx = int((x1 + x2) / 2)
                        cy = int((y1 + y2) / 2)

                        # Check for traffic light detection & classify color
                        if cls_id == 9:
                            tl_crop = frame[y1:y2, x1:x2]
                            sig_color = self._classify_traffic_light_color(tl_crop)
                            if sig_color:
                                detected_signal_state = sig_color

                            detections.append({
                                "bbox": [x1, y1, x2, y2],
                                "confidence": round(conf, 3),
                                "class_id": 9,
                                "class_name": f"Traffic Light ({sig_color or 'Active'})",
                                "center": [cx, cy],
                                "width": box_w,
                                "height": box_h,
                                "signal_color": sig_color
                            })
                            continue

                        class_name = TRAFFIC_CLASSES.get(cls_id, f"Class {cls_id}")

                        # Dynamic vehicle sub-classification for authentic Philippine traffic enforcement
                        aspect = box_w / float(max(1, box_h))
                        if cls_id == 3:
                            class_name = "Motorcycle / Scooter"
                        elif cls_id == 1:
                            class_name = "Bicycle / Light E-Trike"
                        elif cls_id == 5:
                            class_name = "Public Utility Bus"
                        elif cls_id in (2, 7) and box_w > 35 and box_h > 25:
                            v_crop = frame[y1:y2, x1:x2]
                            mean_bgr = v_crop.mean(axis=(0, 1)) if (v_crop is not None and v_crop.size > 0) else [128, 128, 128]
                            is_dark = (mean_bgr[0] < 115 and mean_bgr[1] < 115 and mean_bgr[2] < 115)

                            # Identify Ford Raptor / pickup trucks with wide track
                            if is_dark and 1.1 <= aspect <= 2.8 and box_w >= 50:
                                class_name = "Ford Raptor (Black Pickup)"
                            elif cls_id == 7 or (aspect > 1.8 and box_h > 60):
                                class_name = "Commercial Delivery Truck"
                            elif 0.82 <= aspect <= 1.25:
                                class_name = "SUV / AUV (High Clearance)"
                            elif aspect > 1.25:
                                class_name = "Private Sedan / Compact"
                            else:
                                class_name = "Private Vehicle (Sedan/Hatchback)"

                        detections.append({
                            "bbox": [x1, y1, x2, y2],
                            "confidence": round(conf, 3),
                            "class_id": cls_id,
                            "class_name": class_name,
                            "center": [cx, cy],
                            "width": box_w,
                            "height": box_h
                        })
                if detected_signal_state is None:
                    detected_signal_state = self._detect_overhead_red_beacon(frame)
                return detections, detected_signal_state
            except Exception as e:
                print(f"[YOLO Detector] Error during inference: {e}")

        # Fallback: OpenCV contour/edge vehicle detector
        fallback_dets = self._opencv_fallback_detect(frame)
        fallback_sig = self._detect_overhead_red_beacon(frame)
        return fallback_dets, fallback_sig

    def _detect_overhead_red_beacon(self, frame: np.ndarray) -> Optional[str]:
        """
        Analyzes the upper portion of the surveillance frame for glowing red traffic signals.
        Requires circularity check and high luminance to avoid false positives from red car paint,
        vehicle tail-lights, or roadside advertisements.
        """
        if frame is None or frame.size == 0:
            return None
        try:
            h, w = frame.shape[:2]
            # Confine search strictly to upper 45% of camera viewport where signals hang
            upper_crop = frame[0:int(h * 0.45), :]
            hsv = cv2.cvtColor(upper_crop, cv2.COLOR_BGR2HSV)

            # High-luminance, high-saturation red signal ranges
            m1 = cv2.inRange(hsv, np.array([0, 110, 160]), np.array([12, 255, 255]))
            m2 = cv2.inRange(hsv, np.array([165, 110, 160]), np.array([180, 255, 255]))
            red_mask = m1 | m2

            num_red_pixels = cv2.countNonZero(red_mask)
            if num_red_pixels >= 15:
                contours, _ = cv2.findContours(red_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
                for cnt in contours:
                    area = cv2.contourArea(cnt)
                    if 16 <= area <= 2500:
                        perimeter = cv2.arcLength(cnt, True)
                        if perimeter > 0:
                            # Circularity = 4 * pi * Area / Perimeter^2 (1.0 for perfect circle)
                            circularity = (4.0 * np.pi * area) / (perimeter * perimeter)
                            x, y, bw, bh = cv2.boundingRect(cnt)
                            aspect = bw / float(max(1, bh))

                            # Traffic light lenses are circular (aspect 0.7 - 1.4, circularity >= 0.52)
                            if circularity >= 0.52 and 0.65 <= aspect <= 1.45:
                                return "RED"
        except Exception:
            pass
        return None

    def _classify_traffic_light_color(self, crop: np.ndarray) -> Optional[str]:
        """Analyzes HSV color histogram of detected traffic light box to determine state."""
        if crop is None or crop.size == 0 or crop.shape[0] < 8 or crop.shape[1] < 4:
            return None

        try:
            hsv = cv2.cvtColor(crop, cv2.COLOR_BGR2HSV)

            # Red has two HSV ranges
            lower_red1 = np.array([0, 70, 70])
            upper_red1 = np.array([10, 255, 255])
            lower_red2 = np.array([160, 70, 70])
            upper_red2 = np.array([180, 255, 255])

            mask_red1 = cv2.inRange(hsv, lower_red1, upper_red1)
            mask_red2 = cv2.inRange(hsv, lower_red2, upper_red2)
            mask_red = mask_red1 | mask_red2

            # Yellow range
            lower_yellow = np.array([15, 70, 70])
            upper_yellow = np.array([35, 255, 255])
            mask_yellow = cv2.inRange(hsv, lower_yellow, upper_yellow)

            # Green range
            lower_green = np.array([40, 70, 70])
            upper_green = np.array([90, 255, 255])
            mask_green = cv2.inRange(hsv, lower_green, upper_green)

            count_red = int(cv2.countNonZero(mask_red))
            count_yellow = int(cv2.countNonZero(mask_yellow))
            count_green = int(cv2.countNonZero(mask_green))

            max_val = max(count_red, count_yellow, count_green)
            if max_val > 15:
                if max_val == count_red:
                    return "RED"
                elif max_val == count_yellow:
                    return "YELLOW"
                elif max_val == count_green:
                    return "GREEN"
        except Exception:
            pass

        return None

    def _opencv_fallback_detect(self, frame: np.ndarray) -> List[Dict[str, Any]]:
        """OpenCV contour and aspect ratio vehicle localization fallback."""
        h, w = frame.shape[:2]
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)
        edges = cv2.Canny(blurred, 50, 150)

        # Dilate edges to connect contours
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (5, 5))
        dilated = cv2.dilate(edges, kernel, iterations=2)

        contours, _ = cv2.findContours(dilated, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detections = []

        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area < (w * h * 0.015) or area > (w * h * 0.75):
                continue

            x, y, bw, bh = cv2.boundingRect(cnt)
            aspect = bw / float(bh)
            if 0.5 <= aspect <= 3.2:
                cx = x + bw // 2
                cy = y + bh // 2
                detections.append({
                    "bbox": [x, y, x + bw, y + bh],
                    "confidence": 0.88,
                    "class_id": 2,
                    "class_name": "Private Sedan / SUV",
                    "center": [cx, cy],
                    "width": bw,
                    "height": bh
                })

        return detections[:10]
