# MineGuard AI — Project Inventory
**SIH Problem Statement:** SIH 26008 — Conveyor Belt Defect Detection  
**Generated:** 2026-09-18 21:18:27  

---

## 1. Trained Model Checkpoints

| Checkpoint Path | Architecture | Input Size | Size (MB) | MD5 | Status / Role |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `detect/train/weights/best.pt` | YOLO11s | 640x640 | 18.29 | `1ec35c64` | **BASELINE_ORIGINAL_MODEL** (Sep 4, 2026) |
| `models/final_sih_model.pt` | YOLO11s | 800x800 | 18.32 | `ee136ef2` | **CURRENT PRODUCTION MODEL** |
| `models/archive/final_sih_model_v1.pt` | YOLO11s | 800x800 | 18.32 | `ee136ef2` | Production V1 Backup |
| `models/archive/original_baseline_v1.pt` | YOLO11s | 640x640 | 18.29 | `1ec35c64` | Original Baseline Backup |
| `belt_defect_yolo11s/run_v3_balanced/weights/best.pt` | YOLO11s | 800x800 | 18.32 | `ee136ef2` | Candidate v3 balanced (800px) |
| `belt_defect_yolo11m/run_800_medium-2/weights/best.pt` | YOLO11m | 800x800 | 38.68 | `74bbecbe` | Candidate Medium Model |
| `run_v3_balanced/weights/best.pt` | YOLO11s | 512x512 | 18.27 | `cf7118c4` | Candidate 512px v3 |
| `13 belt_output/detect/belt_defect_yolo11s/run_512_optimized/weights/best.pt` | YOLO11s | 512x512 | 18.28 | `6ab2eca7` | Candidate 512px Run 1 |

---

## 2. Discovered Datasets

| Dataset Identifier | Path | Format | Images | Annotations | Notes |
| :--- | :--- | :---: | :---: | :---: | :--- |
| **Roboflow Primary Dataset** | `D:/SIH/anband told/belt predutor` | YOLO | 1,556 | 2,474 | 1363 train, 122 valid, 71 test (800x800) |
| **Real-World Test Suite** | `real_world_test/` | Raw RGB | 12 | — | Unseen industrial video frames (11 defects, 1 healthy) |
| **Known Defect Tests** | `known_defect_tests/` | Raw RGB | 25 | — | 5 verified samples per class for regression audits |
| **Dataset NEW 600** | `D:/SIH/NEW 600` | YOLO | 646 | — | Roboflow belt-defects-pljtu dataset |
| **Adaptive BW Dataset** | `D:/SIH/conveyor` | YOLO | 9,996 | — | Cement bag / conveyor telemetry dataset |

---

## 3. Training & Validation Scripts

* `model_benchmark.py`: Automated discovery and validation benchmarking script.
* `evaluate_all_models_full.py` / `run_complete_evaluation_suite.py`: Multi-model metric calculation engine.
* `run_tuning_and_sweeps.py`: Threshold, NMS IoU, and multi-resolution sweep suite.
* `test_pipeline.py`: 12-point automated regression test suite.

---

## 4. Web Application & Inference Pipeline

* **Flask Backend Server:** `app_backend_server.py` (Port 5000)
* **FastAPI Backend Server:** `fastapi_app.py` (Port 8000)
* **Gradio GUI:** `app.py` (Port 7860)
* **Unified Preprocessor & Inference Engine:** `unified_preprocessor.py`
  - Current Production Model Path: `models/final_sih_model.pt`
  - Native Resolution: 800x800 letterboxed
  - Thresholds: Default `conf=0.25`, `iou=0.50`
  - Health State Segregation: `DEFECT_DETECTED`, `NO_DETECTIONS`, `NORMAL_BELT`, `ANALYSIS_ERROR`
* **Frontend Web Dashboard:** `templates/index.html`, `static/js/main.js`, `static/css/style.css`
