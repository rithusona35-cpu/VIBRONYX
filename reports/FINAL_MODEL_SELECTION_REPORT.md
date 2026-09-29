# Final Model Selection Report
**SIH 26008: Automated Conveyor Belt Defect Detection System**
*Date: 2026-09-18*

---

## 1. Final Model Decision
- **Selected Production Model**: **`models/final_sih_model.pt`** (RETAINED)
- **Model Architecture**: YOLO11s (9,414,735 parameters, 21.4 GFLOPs at 800×800)
- **Operating Parameters**: Confidence Threshold = **0.25**, NMS IoU = **0.50**

---

## 2. Validation Gate Check (12 Gates)

| Gate # | Validation Criterion | Status | Empirical Evidence |
| :--- | :--- | :--- | :--- |
| **Gate 1** | Zero dataset sequence leakage | **PASS** | `reports/DATASET_V3_SPLIT_AUDIT.md` (0% sequence overlap across 544 sequence groups) |
| **Gate 2** | Zero test contamination | **PASS** | Strict physical sequence isolation; holdout suites excluded from training |
| **Gate 3** | Validation metrics reproducible | **PASS** | Confirmed on sequence-isolated validation set across multiple evaluations |
| **Gate 4** | Real-world holdout does not regress | **PASS** | 100% defect recall (11/11 frames detected) |
| **Gate 5** | Critical-defect recall does not regress | **PASS** | Belt Splice: 100.0%, Longitudinal Tear: 94.62% |
| **Gate 6** | False positives remain acceptable | **PASS** | 0 false alarms on clean rubber and hard negative sets |
| **Gate 7** | Deep Scratch recall scientifically justified | **PASS** | 89.36% recall; failures traced to low-illumination crevices in `reports/scratch_failure_analysis.md` |
| **Gate 8** | Slight Scratch recall does not regress | **PASS** | 73.53% recall |
| **Gate 9** | Longitudinal Tear recall does not regress | **PASS** | 94.62% recall (Candidate B dropped to 76.91%) |
| **Gate 10** | Belt Splice recall does not regress | **PASS** | 100.0% recall (Candidate B dropped to 95.12%) |
| **Gate 11** | Latency remains deployable | **PASS** | 168.2 ms PyTorch CPU / 138.3 ms ONNX Runtime CPU / ~8.4 ms projected Jetson TensorRT |
| **Gate 12** | Candidate beats production model | **FAIL (Candidate B Rejected)** | Candidate B regressed on Longitudinal Tear (-17.7%) and Belt Splice (-4.88%) |

---

## 3. Why `final_sih_model.pt` is Kept and Others are Rejected
1. **Candidate B (`models/candidates/candidate_B_v3.pt`)**: Rejected due to catastrophic failure on critical structural defects. It missed 21 longitudinal tears (vs 5 by production) and 2 belt splices (vs 0 by production).
2. **Candidate C (`models/candidates/candidate_C_controlled_aug.pt`)**: Rejected because aggressive lighting augmentation caused deep scratch recall to collapse from 89.36% down to 61.70%, as well as generating false alarms on clean rubber.
3. **Original Baseline (`detect/train/weights/best.pt`)**: Archived due to lower mAP@50 (61.70% vs 68.15%) and false alarms on clean belt rubber.
