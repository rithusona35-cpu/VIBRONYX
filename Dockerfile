# ==============================================================================
# MINEGUARD AI — DOCKERFILE FOR FASTAPI YOLO BACKEND (SIH 26008)
# Base Image: Python 3.10 Slim
# ==============================================================================

FROM python:3.10-slim

# Prevent Python from writing .pyc files and enable unbuffered logging
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV PORT=8000

WORKDIR /app

# Install system dependencies required for OpenCV, PyTorch, and image processing
RUN apt-get update && apt-get install -y --no-install-recommends \
    libgl1-mesa-glx \
    libglib2.0-0 \
    libgomp1 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Copy application source code, models, and static assets
COPY fastapi_app.py .
COPY unified_preprocessor.py .
COPY models/ ./models/
COPY static/ ./static/
COPY golden_test_images/ ./golden_test_images/
COPY dist/ ./dist/

# Expose container application port
EXPOSE 8000

# Health check to ensure model and ASGI server are healthy
HEALTHCHECK --interval=30s --timeout=5s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8000/health || exit 1

# Start FastAPI ASGI server with Uvicorn
CMD ["sh", "-c", "uvicorn fastapi_app:app --host 0.0.0.0 --port ${PORT}"]
