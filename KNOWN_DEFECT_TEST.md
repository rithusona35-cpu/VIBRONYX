# MINEGUARD AI — ONE KNOWN DEFECT TEST (PHASE 3)
**SIH Problem Statement:** SIH 26008 — Conveyor Belt Defect Detection  
**Target Class:** Longitudinal Tear (Class ID 2)  
**Selected Image File:** `frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg`  
**Image Dimensions:** 800 x 800 px  
**Model Under Test:** `models/best_model.pt` (YOLO11s-v3-800px)  

---

## 1. End-to-End Pipeline Comparison Table

| Stage | Detection | Class | Confidence | Bounding Box [x1, y1, x2, y2] | Status Reported | Result |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Standalone** | YES | Longitudinal Tear | `0.6045` | `[249, 66, 532, 238]` | Raw Tensor Output | **PASS** |
| **Flask API** (`:5000`) | YES | Longitudinal Tear | `0.604` | `[249, 66, 532, 238]` | `ALERT: CRITICAL DEFECT DETECTED` | **PASS** |
| **FastAPI API** (`:8000`) | YES | Longitudinal Tear | `0.604` | `[249, 66, 532, 238]` | `ALERT: CRITICAL DEFECT DETECTED` | **PASS** |
| **Website Dashboard** | YES | Longitudinal Tear | `60.4%` | Rendered on Canvas | `CRITICAL ANOMALY ALERT` | **PASS** |

---

## 2. Confidence Sweep Diagnostic on Known Defect Image (Phase 9)

Evaluated `frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg` across threshold steps:

| Threshold | Detections Count | Detected Classes & Confidences | Health Status |
| :---: | :---: | :--- | :--- |
| **0.10** | 3 | `Longitudinal Tear (0.604)`, `Slight Scratch (0.115)`, `Longitudinal Tear (0.102)` | CRITICAL DEFECT DETECTED |
| **0.15** | 1 | `Longitudinal Tear (0.604)` | CRITICAL DEFECT DETECTED |
| **0.20** | 1 | `Longitudinal Tear (0.604)` | CRITICAL DEFECT DETECTED |
| **0.25 (Default)** | **1** | `Longitudinal Tear (0.604)` | **CRITICAL DEFECT DETECTED** |
| **0.30** | 1 | `Longitudinal Tear (0.604)` | CRITICAL DEFECT DETECTED |
| **0.35** | 1 | `Longitudinal Tear (0.604)` | CRITICAL DEFECT DETECTED |
| **0.40** | 1 | `Longitudinal Tear (0.604)` | CRITICAL DEFECT DETECTED |
| **0.45** | 1 | `Longitudinal Tear (0.604)` | CRITICAL DEFECT DETECTED |
| **0.50** | 1 | `Longitudinal Tear (0.604)` | CRITICAL DEFECT DETECTED |
| **0.60** | 1 | `Longitudinal Tear (0.604)` | CRITICAL DEFECT DETECTED |

---

## 3. Decision Tree Outcome (Phase 4)

* Standalone model detected the defect (`conf = 0.6045`)
* Flask API detected the defect (`conf = 0.604`)
* FastAPI API detected the defect (`conf = 0.604`)
* Website UI displayed `CRITICAL ANOMALY ALERT` with visible bounding box.

**Diagnosis:** Standalone model is **NOT** broken. The previous error where the dashboard showed "NO DEFECTS DETECTED" was caused by the frontend unconditionally defaulting to "HEALTHY" when zero boxes exceeded the hardcoded 0.25 threshold on low-lux or faint images.
