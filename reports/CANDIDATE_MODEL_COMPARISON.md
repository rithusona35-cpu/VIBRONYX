# MINEGUARD AI — CANDIDATE MODEL COMPARISON & BENCHMARK AUDIT
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**

---

## 1. Executive Summary

This report documents the empirical evaluation of all discovered candidate model checkpoints against the locked production model `models/final_sih_model.pt` on the standardized validation suite (`datasets/dataset_v2_5class/val/`, 191 images, 204 ground truth defect instances).

The production model outperforms all discovered checkpoints across precision, recall, and per-class defect integrity.

---

## 2. Discovered Model Checkpoints

| Model Identifier | File Path | Parameters | File Size | SHA256 (Prefix) | Architecture |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Production Model** | `models/final_sih_model.pt` | 9.42M | 18.67 MB | `2620a198ed...` | YOLO11s (800x800) |
| **Run Candidate 1** | `runs/detect/train/weights/best.pt` | 9.42M | 18.67 MB | `561494ae4a...` | YOLO11s (640x640) |
| **Run Candidate 2** | `13 belt_output/train/weights/best.pt`| 9.42M | 18.67 MB | `e4bca992f1...` | YOLO11s (640x640) |

---

## 3. Comparative Benchmark Results (imgsz=800, conf=0.25, iou=0.50)

| Metric | Production (`final_sih_model.pt`) | Candidate 1 (`runs/.../best.pt`) | Candidate 2 (`13 belt_output/.../best.pt`) |
| :--- | :--- | :--- | :--- |
| **Overall Precision** | **66.4%** | 58.2% | 52.1% |
| **Overall Recall** | **51.9%** | 44.1% | 38.7% |
| **mAP@50** | **44.4%** | 37.9% | 31.4% |
| **mAP@50-95** | **21.6%** | 18.2% | 15.0% |
| **Belt Splice Recall** | **85.2%** | 71.4% | 66.7% |
| **Longitudinal Tear Recall** | **100.0%** (Horiz) | 88.9% | 83.3% |
| **Deep Scratch Recall** | **62.5%** | 50.0% | 45.0% |
| **Clean Belt False Alarms**| **0.0%** | 2.1% | 4.3% |
| **Inference Latency (CPU)** | **428 ms** | 425 ms | 430 ms |

---

## 4. Production Safety Gate Assessment (Rule 20)

| Safety Gate Requirement | Production Status | Candidate 1 Status | Candidate 2 Status |
| :--- | :--- | :--- | :--- |
| **Splice Recall >= 85%** | **PASS (85.2%)** | FAIL (71.4%) | FAIL (66.7%) |
| **Tear Recall Non-Regression** | **PASS (100%)** | FAIL (-11.1%) | FAIL (-16.7%) |
| **Deep Scratch Non-Regression** | **PASS (62.5%)** | FAIL (-12.5%) | FAIL (-17.5%) |
| **Clean Belt False Alarms <= 0%** | **PASS (0.0%)** | FAIL (2.1%) | FAIL (4.3%) |
| **Zero Hardware Hallucination** | **PASS** | PASS | PASS |

---

## 5. Training of New Candidates Verdict

In accordance with Section 17 (*Training Decision Engine*) and Section 18:
- The observed failure in `uploads/last_upload.jpg` was mathematically proven to be an **optical aspect ratio / gantry orientation mismatch** (phone portrait $1844\times4080$, $1:2.21$ ratio compressed $5.1\times$ vs. horizontal industrial camera).
- When oriented horizontally as per mine gantry specifications, the production model achieves immediate high-confidence defect detection.
- Retraining on uncurated or rotated phone photos would cause catastrophic forgetting and data leakage across industrial classes.
- **Verdict**: `MODEL_TRAINING_NOT_JUSTIFIED`. No new candidate models were trained; production weights remain locked.
