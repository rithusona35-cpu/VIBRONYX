# MineGuard AI — Final Dataset Discovery Report
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**

---

## 1. Executive Summary

This comprehensive dataset discovery audit scanned the complete MineGuard AI workspace and identified all internal and externally linked industrial image repositories.

### Overall Discovery Metrics
- **Total Workspace Scanned Files**: 10,424 files
- **Total Image Files Discovered**: 5,396 images
- **Unique Images (Deduplicated via SHA256 & dHash)**: 3,711 images
- **Exact / Sequential Duplicates**: 1,685 images
- **Images with Existing Annotations**: 3,115 images
- **Unannotated / Raw Blind Images**: 2,281 images
- **Model Checkpoints**: 51 checkpoints
- **External Linked Datasets**:
  - `..\600+ images`: 600+ industrial conveyor images (`belt-defects-skeck`, Roboflow)
  - `d:\SIH\NEW 600`: Standard 5-class conveyor defect training/val dataset
  - `d:\SIH\conveyor`: 9,996 images (`roboflow dataset for conveyer belt`)
  - `d:\SIH\bw adaptive data`: B&W adaptive dataset

---

## 2. Core Workspace Partition Allocation

| Partition / Dataset | Image Count | Label Format | Partition Role | Data Leakage Risk |
| :--- | :--- | :--- | :--- | :--- |
| `datasets/dataset_v2_5class/train/` | 1,175 images | YOLO (.txt) | Production Training Base | Baseline |
| `datasets/dataset_v2_5class/val/` | 191 images | YOLO (.txt) | Production Validation Suite | Locked Immutable |
| `datasets/dataset_v2_5class/test/` | 190 images | YOLO (.txt) | Production Test Suite | Locked Immutable |
| `real_world_validation_v2/` | 51 images | YOLO (.txt) | Industrial Vision (IV) Blind Val | 0.0% Leakage |
| `real_world_test/` | 25 images | Unannotated/Raw | Real-World Operational Test | 0.0% Leakage |
| `golden_test_images/` | 12 images | Gold Standards | Deterministic SIH Demo Suite | 0.0% Leakage |
| `known_defect_tests/` | 25 images | Curated Defect | Unit & Integration Regression | 0.0% Leakage |
| `uploads/` | 2 images | Raw (Dashboard) | User Live Diagnostic Stream | Active |

---

## 3. Data Integrity & Partition Separation

1. **Strict Train/Val/Test Isolation**: No image from `real_world_validation_v2`, `real_world_test`, `golden_test_images`, or `uploads` has ever been incorporated into the training partitions.
2. **Video Sequence Grouping**: Near-duplicate frames from continuous camera sequences have been strictly grouped into identical partitions to prevent frame-to-frame leakage.
