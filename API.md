# MineGuard AI — FastAPI Inference API Documentation
**Smart India Hackathon (SIH 26008)**  
*Industrial Conveyor Belt Defect Detection, Predictive Monitoring & Safety Shutdown System*

---

## 1. Overview & Architecture

The MineGuard AI backend is a lightweight, asynchronous ASGI service built with **FastAPI** and **Ultralytics YOLO11s**. It serves real-time neural tensor inference for industrial conveyor belt defect inspection, providing sub-200ms latency on commodity CPU hardware.

### High-Level Flow
```
[ Browser / Dashboard ]
        │
        │ HTTP/HTTPS (Multipart Image or JSON)
        ▼
[ FastAPI Backend (Port 8000) ]
        │
        ├── CORS Middleware (Configurable Origins)
        ├── 15 MB File Size & Mime-Type Guard
        ├── EXIF Rotation & Dimension Normalization
        │
        ▼
[ MineGuardInferenceEngine (800x800 FP32/CPU) ]
        │
        ▼
[ models/final_sih_model.pt (YOLO11s, 9.41M Params) ]
        │
        ▼
[ Standardized JSON Response (Detections + Bounding Boxes + Telemetry) ]
```

---

## 2. Base Configuration & Headers

- **Default Port**: `8000` (configurable via `PORT` environment variable)
- **Base URL**: `http://localhost:8000` (local) or your public deployment domain (e.g., `https://mineguard-api.onrender.com`)
- **CORS**: Configurable via `ALLOWED_ORIGINS` environment variable (defaults to `*`)
- **Max Payload Size**: `15 MB`
- **Supported Image Formats**: `.jpg`, `.jpeg`, `.png`, `.webp`

---

## 3. Endpoints

### 3.1. Health Check
Checks whether the FastAPI service is active and the YOLO neural weights are loaded in memory.

- **Method**: `GET`
- **Path**: `/health` (also available as `/api/ai/health`)
- **Authentication**: None

#### Success Response (`HTTP 200 OK`)
```json
{
  "status": "online",
  "model_loaded": true
}
```

#### Degraded Response (`HTTP 200 OK`)
```json
{
  "status": "degraded",
  "model_loaded": false
}
```

---

### 3.2. Model Information
Returns public model specifications and taxonomy without exposing private filesystem paths.

- **Method**: `GET`
- **Path**: `/model-info` (also available as `/api/model_info`)
- **Authentication**: None

#### Success Response (`HTTP 200 OK`)
```json
{
  "model_name": "MineGuard-YOLO",
  "model_version": "YOLO11s-Small-800px",
  "classes": [
    "belt splice",
    "deep scratch",
    "longitudinal tear",
    "normal belt",
    "slight scratch"
  ],
  "class_mapping": {
    "0": "belt splice",
    "1": "deep scratch",
    "2": "longitudinal tear",
    "3": "normal belt",
    "4": "slight scratch"
  },
  "display_names": {
    "0": "Belt Splice",
    "1": "Deep Scratch",
    "2": "Longitudinal Tear",
    "3": "Normal Belt",
    "4": "Slight Scratch"
  },
  "image_size": [800, 800],
  "confidence_threshold": 0.25,
  "iou_threshold": 0.45,
  "device": "cpu",
  "status": "online"
}
```

---

### 3.3. Defect Detection
Executes neural inference on an uploaded conveyor belt image or a curated test sample.

- **Method**: `POST`
- **Path**: `/api/detect`
- **Content-Type**: `multipart/form-data`

#### Request Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `file` | File (`binary`) | Optional* | The raw image file (`.jpg`, `.jpeg`, `.png`, `.webp`, max 15MB). |
| `sample_filename` | String | Optional* | Filename of a preloaded sample in `static/samples/`. |
| `conf` | Float | Optional | Confidence threshold (default `0.25`). |
| `iou` | Float | Optional | NMS IoU threshold (default `0.45`). |

*\*At least one of `file` or `sample_filename` must be provided.*

#### Success Response: Defect Detected (`HTTP 200 OK`)
```json
{
  "success": true,
  "model": "MineGuard-YOLO",
  "model_version": "YOLO11s-Small-800px",
  "class": "Longitudinal Tear",
  "confidence": 0.604,
  "severity": "CRITICAL",
  "defects": [
    "Longitudinal Tear"
  ],
  "detections": [
    {
      "class_id": 2,
      "class": "longitudinal tear",
      "class_name": "longitudinal tear",
      "display_name": "Longitudinal Tear",
      "confidence": 0.604,
      "bbox": [53, 403, 765, 597],
      "color": "#f43f5e",
      "severity": "CRITICAL",
      "recommended_action": "EMERGENCY: Shut down belt conveyor immediately to prevent complete split."
    }
  ],
  "boxes": [
    {
      "class_id": 2,
      "class": "longitudinal tear",
      "class_name": "longitudinal tear",
      "display_name": "Longitudinal Tear",
      "confidence": 0.604,
      "bbox": [53, 403, 765, 597],
      "color": "#f43f5e",
      "severity": "CRITICAL",
      "recommended_action": "EMERGENCY: Shut down belt conveyor immediately to prevent complete split."
    }
  ],
  "inference_time_ms": 138.4,
  "processing_time_ms": 152.1,
  "latency_ms": 152.1,
  "total_detections": 1,
  "status": "ALERT: CRITICAL DEFECT DETECTED",
  "status_color": "#ef4444",
  "health_state": "DEFECT_DETECTED",
  "highest_severity": "CRITICAL",
  "recommended_action": "EMERGENCY STOP: Immediate conveyor shutdown required for splice/tear repair.",
  "hardware_control": {
    "health_state": "DEFECT_DETECTED",
    "defect_class": "LONGITUDINAL_TEAR",
    "confidence": 0.604,
    "severity": "CRITICAL",
    "action": "STOP_CONVEYOR"
  },
  "original_image_dimensions": [800, 600],
  "image_width": 800,
  "image_height": 600,
  "confidence_threshold": 0.25,
  "iou_threshold": 0.45
}
```

#### Success Response: Normal Belt (`HTTP 200 OK`)
```json
{
  "success": true,
  "model": "MineGuard-YOLO",
  "model_version": "YOLO11s-Small-800px",
  "class": "No Defect Detected",
  "confidence": null,
  "severity": "NORMAL",
  "defects": [],
  "detections": [],
  "boxes": [],
  "inference_time_ms": 124.7,
  "processing_time_ms": 136.2,
  "total_detections": 0,
  "status": "NO DEFECT DETECTED ABOVE THRESHOLD (CONF >= 0.25)",
  "status_color": "#38bdf8",
  "health_state": "NO_DETECTIONS",
  "highest_severity": "NO_DETECTIONS",
  "recommended_action": "CONTINUE MONITORING: No abnormal defect signatures detected above threshold.",
  "hardware_control": {
    "health_state": "NO_DETECTIONS",
    "defect_class": null,
    "confidence": null,
    "severity": "NORMAL",
    "action": "CONTINUE"
  },
  "original_image_dimensions": [800, 600],
  "image_width": 800,
  "image_height": 600,
  "confidence_threshold": 0.25,
  "iou_threshold": 0.45
}
```

#### Error Responses
- `HTTP 400 Bad Request`: Invalid file format or missing image.
  ```json
  { "detail": "Unsupported file format '.pdf'. Allowed formats: JPG, JPEG, PNG, WEBP." }
  ```
- `HTTP 413 Payload Too Large`: Uploaded file exceeds 15 MB.
  ```json
  { "detail": "File size exceeds 15MB limit (18.2MB)." }
  ```
- `HTTP 500 Internal Server Error`: Internal inference exception.
  ```json
  { "detail": "Inference processing error: <error_message>" }
  ```

---

### 3.4. Multi-Model Cross-Check
Evaluates candidate models against the frozen production model on a selected frame to verify classification consistency.

- **Method**: `POST`
- **Path**: `/api/models/cross_check`
- **Content-Type**: `application/json`

#### Request Body
```json
{
  "sample_filename": "frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg"
}
```

#### Success Response (`HTTP 200 OK`)
```json
{
  "status": "success",
  "sample": "frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg",
  "active_model": {
    "name": "MineGuard YOLO11s (Production)",
    "prediction": "Longitudinal Tear",
    "confidence": 0.604,
    "latency_ms": 138.2
  },
  "agreement": true,
  "cross_check": [
    {
      "model": "YOLO11s (Production)",
      "predicted_class": "Longitudinal Tear",
      "confidence": 0.604,
      "latency_ms": 138.2
    }
  ]
}
```

---

## 4. cURL Testing Examples

### 1. Test Health Status
```bash
curl -X GET "http://localhost:8000/health"
```

### 2. Query Model Metadata
```bash
curl -X GET "http://localhost:8000/model-info"
```

### 3. Run Inference on a Local Belt Image
```bash
curl -X POST "http://localhost:8000/api/detect" \
  -F "file=@static/samples/longitudinal_tear.jpg" \
  -F "conf=0.25"
```

### 4. Run Inference on a Curated Sample by Name
```bash
curl -X POST "http://localhost:8000/api/detect" \
  -F "sample_filename=longitudinal_tear.jpg"
```
