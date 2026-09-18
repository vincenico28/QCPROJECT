# ==============================================================================
# QC Flow Guardian - AI Traffic Sentry Microservice (FastAPI + YOLOv8 + OpenCV)
# ==============================================================================
FROM python:3.11-slim

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000

WORKDIR /app

# Install system libraries for OpenCV, video decoding, and network utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1 \
    libglib2.0-0 \
    libgomp1 \
    ffmpeg \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install PyTorch CPU-only first for lightweight builds (~180MB vs 3GB+ CUDA)
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu

# Copy requirements and install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-bake YOLOv8n model weights so container starts offline instantly
RUN python -c "from ultralytics import YOLO; YOLO('yolov8n.pt')"

# Copy application code and model weights
COPY . .

# Expose API port
EXPOSE 8000

# Start FastAPI entrypoint via run.py
CMD ["python", "run.py"]
