"""
run.py - CLI Entrypoint for Quezon City AI Traffic Sentry Microservice
"""
import os
import uvicorn

if __name__ == "__main__":
    # Ensure current dir is in Python path
    import sys
    import socket
    sys.path.insert(0, os.path.dirname(__file__))

    port = int(os.getenv("PORT", 8000))

    # Pre-check if port is already occupied
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        in_use = s.connect_ex(("127.0.0.1", port)) == 0
        if in_use:
            print("================================================================")
            print(f"  [WARNING] PORT {port} IS ALREADY IN USE!")
            print(f"  The AI microservice is already running on: http://127.0.0.1:{port}")
            print(f"  Health Check: http://127.0.0.1:{port}/health")
            print("  If you want to restart it, first stop the existing process:")
            print("    taskkill /F /IM python.exe")
            print("================================================================")
            sys.exit(0)

    print("================================================================")
    print("  QUEZON CITY DPOS - REAL-TIME TRAFFIC AI SENTRY MICROSERVICE")
    print("  YOLOv8 & OpenCV Deep Computer Vision Detection & Tracking Engine")
    print(f"  Running on: http://127.0.0.1:{port}")
    print("================================================================")

    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=False)
