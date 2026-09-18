"""
evidence.py - Official NCAP Watermarked Evidence Snapshot Generator
Quezon City Flow Guardian - Real-Time AI Violation Detection Suite
"""

import cv2
import base64
import numpy as np
from datetime import datetime
from typing import Dict, Any, Tuple

class EvidenceGenerator:
    def __init__(self):
        pass

    def create_evidence_snapshot(
        self,
        frame: np.ndarray,
        violation: Dict[str, Any],
        plate_data: Dict[str, Any],
        camera_code: str = "CAM-042",
        location: str = "Commonwealth Ave cor. Tandang Sora"
    ) -> Tuple[np.ndarray, str]:
        """
        Creates an official QC MMDA NCAP watermarked evidence snapshot.
        Returns:
            (evidence_image_bgr, base64_jpeg_data_url)
        """
        if frame is None or frame.size == 0:
            frame = np.zeros((720, 1280, 3), dtype=np.uint8)

        canvas = frame.copy()
        h, w = canvas.shape[:2]

        # Draw violation target bounding box on the frame
        bbox = violation.get("bbox")
        if bbox:
            bx1, by1, bx2, by2 = bbox
            cv2.rectangle(canvas, (bx1, by1), (bx2, by2), (0, 0, 240), 3)
            # Corner markers
            cl = 15
            cv2.line(canvas, (bx1, by1), (bx1 + cl, by1), (0, 220, 255), 4)
            cv2.line(canvas, (bx1, by1), (bx1, by1 + cl), (0, 220, 255), 4)
            cv2.line(canvas, (bx2, by2), (bx2 - cl, by2), (0, 220, 255), 4)
            cv2.line(canvas, (bx2, by2), (bx2, by2 - cl), (0, 220, 255), 4)

            # Target badge
            tag_text = f"TARGET: {plate_data.get('plate_number', 'UNREGISTERED')} [{violation.get('vehicle_class', 'Vehicle')}]"
            cv2.putText(canvas, tag_text, (bx1, max(25, by1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 240, 255), 2)

        # -------------------------------------------------------------
        # 1. Header Bar: QC DPOS MMDA NCAP Seal
        # -------------------------------------------------------------
        header_h = 56
        overlay = canvas.copy()
        cv2.rectangle(overlay, (0, 0), (w, header_h), (15, 23, 42), -1)
        cv2.addWeighted(overlay, 0.88, canvas, 0.12, 0, canvas)
        cv2.line(canvas, (0, header_h), (w, header_h), (0, 180, 255), 2)

        cv2.putText(canvas, "REPUBLIC OF THE PHILIPPINES * QUEZON CITY DPOS", (20, 24), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (220, 220, 220), 1)
        cv2.putText(canvas, "NO-CONTACT APPREHENSION PROGRAM (NCAP) - AI EVIDENCE SENTRY", (20, 46), cv2.FONT_HERSHEY_SIMPLEX, 0.65, (0, 220, 255), 2)

        status_text = "STATUS: AI VERIFIED OFFENSE"
        cv2.putText(canvas, status_text, (w - 320, 36), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 60, 255), 2)

        # -------------------------------------------------------------
        # 2. Footer Telemetry Bar
        # -------------------------------------------------------------
        footer_h = 95
        overlay = canvas.copy()
        cv2.rectangle(overlay, (0, h - footer_h), (w, h), (10, 15, 28), -1)
        cv2.addWeighted(overlay, 0.90, canvas, 0.10, 0, canvas)
        cv2.line(canvas, (0, h - footer_h), (w, h - footer_h), (0, 180, 255), 1)

        now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S PST")
        vio_type = violation.get("violation_type", "Traffic Infraction")
        fine = violation.get("fine_amount", 1000.0)
        speed = violation.get("speed_kmh", 45.0)
        conf = round(violation.get("confidence", 0.95) * 100 if violation.get("confidence", 0.95) <= 1.0 else violation.get("confidence", 0.95), 1)

        # Row 1 of footer
        col1 = f"CAMERA: {camera_code} | LOC: {location}"
        col2 = f"TIMESTAMP: {now_str}"
        cv2.putText(canvas, col1, (20, h - 65), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (255, 255, 255), 1)
        cv2.putText(canvas, col2, (w - 420, h - 65), cv2.FONT_HERSHEY_SIMPLEX, 0.52, (0, 220, 255), 1)

        # Row 2 of footer
        col3 = f"OFFENSE: {vio_type.upper()} (QC ORD. SP-2957) | PENALTY: PHP {fine:,.2f}"
        cv2.putText(canvas, col3, (20, h - 38), cv2.FONT_HERSHEY_SIMPLEX, 0.55, (0, 100, 255), 2)

        # Row 3 of footer
        col4 = f"RADAR SPEED: {speed} km/h | AI CONFIDENCE: {conf}% | TRACK ID: {violation.get('track_id', 'TRK-N/A')}"
        cv2.putText(canvas, col4, (20, h - 14), cv2.FONT_HERSHEY_SIMPLEX, 0.48, (180, 180, 180), 1)

        # -------------------------------------------------------------
        # 3. Inset 2x ANPR License Plate Crop (Bottom Right)
        # -------------------------------------------------------------
        plate_crop = plate_data.get("plate_crop")
        if plate_crop is not None and plate_crop.size > 0:
            pw, ph = 240, 70
            resized_p = cv2.resize(plate_crop, (pw, ph))
            px1 = w - pw - 20
            py1 = h - footer_h - ph - 15

            # Border & backdrop
            cv2.rectangle(canvas, (px1 - 4, py1 - 22), (px1 + pw + 4, py1 + ph + 4), (15, 23, 42), -1)
            cv2.rectangle(canvas, (px1 - 4, py1 - 22), (px1 + pw + 4, py1 + ph + 4), (0, 220, 255), 2)
            cv2.putText(canvas, "ANPR 2X OPTICAL CROP", (px1, py1 - 6), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (0, 220, 255), 1)

            # Insert crop
            canvas[py1:py1 + ph, px1:px1 + pw] = resized_p

        # Encode to JPEG base64 data URL
        _, buffer = cv2.imencode(".jpg", canvas, [cv2.IMWRITE_JPEG_QUALITY, 90])
        jpg_bytes = buffer.tobytes()
        b64_str = base64.b64encode(jpg_bytes).decode("utf-8")
        data_url = f"data:image/jpeg;base64,{b64_str}"

        return canvas, data_url
