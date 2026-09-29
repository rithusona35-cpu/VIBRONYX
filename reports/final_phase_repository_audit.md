# MineGuard AI — Final Phase Repository Audit
**SIH 26008: Automated Real-Time Conveyor Belt Defect Detection**

Date: 2026-09-18

## 1. Model Artifacts (.pt & .onnx)
A total of 43 model checkpoints were identified across project directories (excluding venv/):

| Model Path | Architecture | Size (MB) | Role |
| :--- | :--- | :--- | :--- |
| `best.pt` | YOLO11s | 18.29 | **Candidate / Checkpoint** |
| `final_sih_model.pt` | YOLO11s | 18.32 | **PRIMARY_PRODUCTION_MODEL** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\best.pt` | YOLO11s | 18.28 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\epoch0.pt` | YOLO11s | 36.36 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\epoch10.pt` | YOLO11s | 36.36 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\epoch20.pt` | YOLO11s | 36.36 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\epoch30.pt` | YOLO11s | 36.36 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\epoch40.pt` | YOLO11s | 36.36 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\epoch50.pt` | YOLO11s | 36.36 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\epoch60.pt` | YOLO11s | 36.37 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\epoch70.pt` | YOLO11s | 36.37 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\epoch80.pt` | YOLO11s | 36.37 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\epoch90.pt` | YOLO11s | 36.37 | **Candidate / Checkpoint** |
| `13 belt_output\detect\belt_defect_yolo11s\run_512_optimized\weights\last.pt` | YOLO11s | 18.28 | **Candidate / Checkpoint** |
| `belt_defect_yolo11m\run_800_medium-2\weights\best.pt` | YOLO11m | 38.68 | **Candidate / Checkpoint** |
| `belt_defect_yolo11m\run_800_medium-2\weights\last.pt` | YOLO11m | 38.68 | **Candidate / Checkpoint** |
| `belt_defect_yolo11s\run_v3_balanced\weights\best.pt` | YOLO11s | 18.32 | **Candidate / Checkpoint** |
| `belt_defect_yolo11s\run_v3_balanced\weights\last.pt` | YOLO11s | 18.32 | **Candidate / Checkpoint** |
| `belt_output\detect\belt_defect_yolo11s\run_v3_balanced\weights\best.pt` | YOLO11s | 18.28 | **Candidate / Checkpoint** |
| `belt_output\detect\belt_defect_yolo11s\run_v3_balanced\weights\last.pt` | YOLO11s | 18.28 | **Candidate / Checkpoint** |
| `detect\train\weights\best.pt` | YOLO11s | 18.29 | **Candidate / Checkpoint** |
| `detect\train\weights\last.pt` | YOLO11s | 18.29 | **Candidate / Checkpoint** |
| `experiments\experiment_B_clean_dataset\best.pt` | YOLO11s | 18.27 | **EXPERIMENT_B_CLEAN_DATA** |
| `experiments\experiment_C_hard_cases\best.pt` | YOLO11s | 18.27 | **EXPERIMENT_C_HARD_CASES** |
| `models\best_model.pt` | YOLO11s | 18.32 | **Candidate / Checkpoint** |
| `models\final_sih_model.onnx` | YOLO11s (ONNX) | 36.27 | **PRODUCTION_ONNX_EXPORT** |
| `models\final_sih_model.pt` | YOLO11s | 18.32 | **Candidate / Checkpoint** |
| `models\final_sih_model_v1.pt` | YOLO11s | 18.32 | **ARCHIVE_PRODUCTION_V1** |
| `models\final_sih_model_v2.pt` | YOLO11s | 18.27 | **ARCHIVE_CANDIDATE_V2** |
| `models\archive\final_sih_model_v1.pt` | YOLO11s | 18.32 | **ARCHIVE_PRODUCTION_V1** |
| `models\archive\original_baseline_v1.pt` | YOLO11s | 18.29 | **ORIGINAL_BASELINE** |
| `models\baseline\original_baseline_model.pt` | YOLO11s | 18.29 | **ORIGINAL_BASELINE** |
| `models\best\final_sih_model.pt` | YOLO11s | 18.32 | **Candidate / Checkpoint** |
| `models\candidate\yolo11m_800_medium.pt` | YOLO11m | 38.68 | **Candidate / Checkpoint** |
| `models\candidate\yolo11s_512_run1.pt` | YOLO11s | 18.28 | **Candidate / Checkpoint** |
| `models\candidate\yolo11s_512_v3.pt` | YOLO11s | 18.27 | **Candidate / Checkpoint** |
| `models\candidate\yolo11s_800_v3.pt` | YOLO11s | 18.32 | **Candidate / Checkpoint** |
| `runs\detect\experiments\experiment_B_clean_dataset\weights\best.pt` | YOLO11s | 18.27 | **EXPERIMENT_B_CLEAN_DATA** |
| `runs\detect\experiments\experiment_B_clean_dataset\weights\last.pt` | YOLO11s | 18.27 | **EXPERIMENT_B_CLEAN_DATA** |
| `runs\detect\experiments\experiment_C_hard_cases\weights\best.pt` | YOLO11s | 18.27 | **EXPERIMENT_C_HARD_CASES** |
| `runs\detect\experiments\experiment_C_hard_cases\weights\last.pt` | YOLO11s | 18.27 | **EXPERIMENT_C_HARD_CASES** |
| `run_v3_balanced\weights\best.pt` | YOLO11s | 18.27 | **Candidate / Checkpoint** |
| `run_v3_balanced\weights\last.pt` | YOLO11s | 18.27 | **Candidate / Checkpoint** |

### Key Production & Baseline Reference Models:
- **Current Production Model**: `models/final_sih_model.pt` (18.32 MB, MD5: `ee136ef26e5e8e88863f698d28ae83fa`)
- **Production ONNX Export**: `models/final_sih_model.onnx` (36.27 MB, opset 18, onnxslim optimized)
- **Original Baseline Model**: `detect/train/weights/best.pt` (18.29 MB, MD5: `1ec35c64c7ad0606992589083505c87e`)
- **Archived V1 Production**: `models/archive/final_sih_model_v1.pt`
- **Archived V2 Candidate**: `models/final_sih_model_v2.pt` (Experiment C candidate)
- **Experiment B Checkpoint**: `experiments/experiment_B_clean_dataset/best.pt`
- **Experiment C Checkpoint**: `experiments/experiment_C_hard_cases/best.pt`

## 2. Dataset Inventory & Configuration Files
| Dataset Path | Format / YAML | Train Images | Val Images | Test Images | Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `datasets/dataset_v2_5class` | `datasets/dataset_v2_5class/data.yaml` | 1175 | 191 | 190 | Cleaned 5-class sequence-isolated dataset |
| `datasets/dataset_v2_4defect` | `datasets/dataset_v2_4defect/data.yaml` | 1175 | 191 | 190 | Cleaned 4-defect dataset (healthy belt as negative backgrounds) |
| `datasets/hard_cases` | `N/A` | 0 | 0 | 0 | Curated hard cases for low-confidence scratches & tears |

## 3. Test & Holdout Suites
- **`real_world_test/` (12 unique evaluation frames)**:
  - `REAL_HEALTHY/`: 1 frame (`frame_00021_jpg...`)
  - `REAL_BELT_SPLICE/`: 7 frames (`frame_00002`, `frame_00003`, `frame_00005`, `frame_00012`, `frame_00015`, `frame_00019`, `frame_00035`)
  - `REAL_LONGITUDINAL_TEAR/`: 3 frames (`frame_00007`, `frame_00043`, `frame_00045`)
  - `REAL_DEEP_SCRATCH/`: 1 frame (`frame_00024`)
  - `REAL_SLIGHT_SCRATCH/`: 1 frame (`frame_00005`)
- **`known_defect_tests/`**: 25 verified industrial images spanning all 5 classes (5 per class).
- **`hard_negatives/`**: 6 high-difficulty clean belt textures, lighting gradients, and seams.
- **`error_cases/`**: 9 curated false positive, false negative, and poor bounding box reference images.

## 4. Reports & Verification History
Discovered reports in `reports/`:
- [`reports/FINAL_ML_IMPROVEMENT_REPORT_V2.md`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/FINAL_ML_IMPROVEMENT_REPORT_V2.md)
- [`reports/baseline_revalidation.csv`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/baseline_revalidation.csv)
- [`reports/data_leakage_v2.md`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/data_leakage_v2.md)
- [`reports/dataset_anomalies_v2.csv`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/dataset_anomalies_v2.csv)
- [`reports/dataset_audit_v2.md`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/dataset_audit_v2.md)
- [`reports/experiments_summary.json`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/experiments_summary.json)
- [`reports/final_model_comparison_v2.csv`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/final_model_comparison_v2.csv)
- [`reports/final_phase_model_inventory.csv`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/final_phase_model_inventory.csv)
- [`reports/normal_belt_annotation_review.csv`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/normal_belt_annotation_review.csv)
- [`reports/project_inventory.md`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/project_inventory.md)
- [`reports/real_world_holdout_log.csv`](file:///C:/Users/AnbuRithu/Downloads/yolo_output/reports/real_world_holdout_log.csv)