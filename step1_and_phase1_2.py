import os
import shutil
import hashlib
import glob
import datetime

print("Executing Phase 1 (Inventory) & Phase 2 (Model Backup)...")

os.makedirs("reports", exist_ok=True)
os.makedirs("models/archive", exist_ok=True)

def get_hash(path):
    h = hashlib.md5()
    with open(path, "rb") as f:
        for chunk in iter(lambda: f.read(1024*1024), b""):
            h.update(chunk)
    return h.hexdigest()

# 1. Backups
prod_model = "models/final_sih_model.pt"
base_model = "detect/train/weights/best.pt"

backup_prod_archive = "models/archive/final_sih_model_v1.pt"
backup_base_archive = "models/archive/original_baseline_v1.pt"
backup_prod_root = "models/final_sih_model_v1.pt"

if os.path.exists(prod_model):
    shutil.copy2(prod_model, backup_prod_archive)
    shutil.copy2(prod_model, backup_prod_root)
    print(f"Backed up production model to {backup_prod_archive} & {backup_prod_root} (MD5: {get_hash(prod_model)[:8]})")

if os.path.exists(base_model):
    shutil.copy2(base_model, backup_base_archive)
    print(f"Backed up baseline model to {backup_base_archive} (MD5: {get_hash(base_model)[:8]})")

# 2. Project Inventory Report (Phase 1)
inventory_content = f"""# MineGuard AI — Project Inventory
**SIH Problem Statement:** SIH 26008 — Conveyor Belt Defect Detection  
**Generated:** {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  

---

## 1. Trained Model Checkpoints

| Checkpoint Path | Architecture | Input Size | Size (MB) | MD5 | Status / Role |
| :--- | :---: | :---: | :---: | :---: | :--- |
| `detect/train/weights/best.pt` | YOLO11s | 640x640 | 18.29 | `{get_hash(base_model)[:8] if os.path.exists(base_model) else 'N/A'}` | **BASELINE_ORIGINAL_MODEL** (Sep 4, 2026) |
| `models/final_sih_model.pt` | YOLO11s | 800x800 | 18.32 | `{get_hash(prod_model)[:8] if os.path.exists(prod_model) else 'N/A'}` | **CURRENT PRODUCTION MODEL** |
| `models/archive/final_sih_model_v1.pt` | YOLO11s | 800x800 | 18.32 | `{get_hash(backup_prod_archive)[:8] if os.path.exists(backup_prod_archive) else 'N/A'}` | Production V1 Backup |
| `models/archive/original_baseline_v1.pt` | YOLO11s | 640x640 | 18.29 | `{get_hash(backup_base_archive)[:8] if os.path.exists(backup_base_archive) else 'N/A'}` | Original Baseline Backup |
| `belt_defect_yolo11s/run_v3_balanced/weights/best.pt` | YOLO11s | 800x800 | 18.32 | `{get_hash('belt_defect_yolo11s/run_v3_balanced/weights/best.pt')[:8] if os.path.exists('belt_defect_yolo11s/run_v3_balanced/weights/best.pt') else 'N/A'}` | Candidate v3 balanced (800px) |
| `belt_defect_yolo11m/run_800_medium-2/weights/best.pt` | YOLO11m | 800x800 | 38.68 | `{get_hash('belt_defect_yolo11m/run_800_medium-2/weights/best.pt')[:8] if os.path.exists('belt_defect_yolo11m/run_800_medium-2/weights/best.pt') else 'N/A'}` | Candidate Medium Model |
| `run_v3_balanced/weights/best.pt` | YOLO11s | 512x512 | 18.27 | `{get_hash('run_v3_balanced/weights/best.pt')[:8] if os.path.exists('run_v3_balanced/weights/best.pt') else 'N/A'}` | Candidate 512px v3 |
| `13 belt_output/detect/belt_defect_yolo11s/run_512_optimized/weights/best.pt` | YOLO11s | 512x512 | 18.28 | `{get_hash('13 belt_output/detect/belt_defect_yolo11s/run_512_optimized/weights/best.pt')[:8] if os.path.exists('13 belt_output/detect/belt_defect_yolo11s/run_512_optimized/weights/best.pt') else 'N/A'}` | Candidate 512px Run 1 |

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
"""

with open("reports/project_inventory.md", "w", encoding="utf-8") as f:
    f.write(inventory_content)

print("Saved reports/project_inventory.md successfully.")
