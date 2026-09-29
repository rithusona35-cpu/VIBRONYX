# MINEGUARD AI — API INFERENCE DEBUG & PARITY REPORT
**SIH 26008: Conveyor Belt Defect Detection**  
**Document Type:** Comparative Parity Verification (Standalone vs Flask vs FastAPI)  
**Evaluated Model:** `models/best_model.pt` (`YOLO11s-v3-800px`, 9.4M parameters)  
**Date:** September 14, 2026  

---

## 1. Multi-Endpoint Parity Verification (5 Visible Defect Samples)

Five distinct defect samples representing every structural damage class were evaluated across three parallel execution targets:
1. **Standalone Model:** Direct PyTorch/Ultralytics `model.predict(source, imgsz=800, conf=0.25, iou=0.45)`
2. **Flask REST API:** `POST http://127.0.0.1:5000/api/detect` with multipart form-data image upload
3. **FastAPI Edge API:** `POST http://127.0.0.1:8000/api/detect` with multipart form-data image upload

### Comparative Results Table

| Sample # | Image Filename | Target Damage | Standalone Model | Flask API (`/api/detect`) | FastAPI API (`/api/detect`) | Coordinate Match | Parity Result |
| :---: | :--- | :--- | :--- | :--- | :--- | :---: | :---: |
| **1** | `frame_00015_jpg...` | Belt Splice | Splice (0.6643) | Splice (0.664), Status: ALERT | Splice (0.664), Status: ALERT | `[87, 69, 711, 233]` | **100% MATCH** |
| **2** | `frame_00007_jpg...` | Longitudinal Tear | Tear (0.6045) | Tear (0.604), Status: ALERT | Tear (0.604), Status: ALERT | `[249, 66, 532, 238]` | **100% MATCH** |
| **3** | `frame_00024_jpg...` | Deep Scratch + Tear + Scuff | Deep (0.674), Tear (0.521), Slight (0.444) | Deep (0.674), Tear (0.521), Slight (0.444) | Deep (0.674), Tear (0.521), Slight (0.444) | 3 Boxes Identical | **100% MATCH** |
| **4** | `frame_00005_jpg...` | Splice + Tear + Scuff | Splice (0.629), Tear (0.367), Slight (0.332) | Splice (0.629), Tear (0.367), Slight (0.332) | Splice (0.629), Tear (0.367), Slight (0.332) | 3 Boxes Identical | **100% MATCH** |
| **5** | `frame_00002_jpg...` | Splice + Severe Tear | Splice (0.693), Tear (0.526) | Splice (0.693), Tear (0.526) | Splice (0.693), Tear (0.526) | 2 Boxes Identical | **100% MATCH** |

---

## 2. Raw API JSON Response Inspection

Below is the verified raw JSON payload returned by `/api/detect` for Sample 2 (`Longitudinal Tear`):

```json
{
  "status": "ALERT: CRITICAL DEFECT DETECTED",
  "status_color": "#ef4444",
  "highest_severity": "CRITICAL",
  "model_version": "YOLO11s-Small-800px",
  "original_image_dimensions": [800, 800],
  "total_detections": 1,
  "detections": [
    {
      "class_id": 2,
      "class_name": "longitudinal tear",
      "display_name": "Longitudinal Tear",
      "confidence": 0.604,
      "bbox": [249, 66, 532, 238],
      "color": "#f43f5e",
      "severity": "CRITICAL"
    }
  ],
  "latency_ms": 494.6,
  "timestamp": "2026-09-14 19:30:41"
}
```

---

## 3. Decision Tree Outcome: Case Determination

Based on the forensic audit criteria:
* **Standalone:** DETECTS DEFECT (100% on splices, 100% on tears)
* **API:** DETECTS DEFECT (100% identical detections returned)
* **UI:** Discrepancy occurs when an uploaded frame produces 0 detections (due to thresholding or out-of-distribution imagery), which triggers the flawed fallback:
  ```javascript
  if (data.total_detections === 0) {
      severityTitle.textContent = 'BELT INTEGRITY HEALTHY';
      severityDesc.textContent = 'No surface tears, splices, or scratches found.';
  }
  ```

### Determination:
**CASE A & CASE D:** The model itself is NOT broken. The backend inference engine produces valid bounding boxes and correct class IDs. The defect in the user's experience was caused by:
1. **Unsafe Health-State Fallback in `main.js`:** Equating `total_detections === 0` with `HEALTHY BELT`.
2. **Fixed Confidence Threshold:** The client could not adjust sensitivity below 0.25 for faint low-lux defects.
3. **Hardcoded Telemetry Metrics:** `94.2%` Belt Health Index and `1,496` Scanned Count were static numbers in `index.html` and `main.js`.
