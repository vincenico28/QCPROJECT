"""
run.py - CLI Entrypoint for Quezon City AI Traffic Sentry Microservice
"""
import os
import uvicorn

if __name__ == "__main__":
    import sys
    sys.path.insert(0, os.path.dirname(__file__))

    port = int(os.getenv("PORT", 8000))

    print("================================================================")
    print("  QUEZON CITY DPOS - REAL-TIME TRAFFIC AI SENTRY MICROSERVICE")
    print("  YOLOv8 & OpenCV Deep Computer Vision Detection & Tracking Engine")
    print(f"  Starting Uvicorn Server on 0.0.0.0:{port}...")
    print("================================================================", flush=True)

    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False, log_level="info")

