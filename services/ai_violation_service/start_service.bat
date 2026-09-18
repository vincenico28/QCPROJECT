@echo off
title QC Flow Guardian - AI Traffic Violation Sentry Microservice (YOLOv8 + OpenCV)
echo =====================================================================
echo  QUEZON CITY DEPARTMENT OF PUBLIC ORDER AND SAFETY (DPOS)
echo  REAL-TIME TRAFFIC AI VIOLATION DETECTION & CAMERA TRACKING SENTRY
echo =====================================================================
echo Starting FastAPI YOLOv8 + OpenCV Server on port 8000...
cd /d "%~dp0"
python run.py
pause
