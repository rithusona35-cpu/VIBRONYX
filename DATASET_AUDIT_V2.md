# DATASET_AUDIT_V2.md
## Comprehensive Forensic Re-Audit of Industrial Belt Defect Dataset (V2)

### 1. Dataset Overview
* **Repository Source**: `D:\SIH\anband told`
* **Dataset Format**: YOLO Standard Format (`[class_id, x_center, y_center, width, height]`)
* **Total Image Count**: **1,556 images**
* **Total Annotation Count**: **2,474 bounding boxes**
* **Native Resolution**: $800 \times 800$ pixels
* **Color Space**: 3-channel RGB (OpenCV validated)
* **Corrupted Image Count**: **0** (100% integrity across all splits)
* **Missing Label Files**: **0**
* **Empty Label Files**: **0**

---

### 2. Deep Annotation Geometry & Quality Analysis

| Metric | Measured Value | Standard Acceptable Range | Assessment |
| :--- | :---: | :---: | :--- |
| **Out-of-Bounds Coordinates** | **0 boxes (0%)** | 0% | 🟢 All $(x_c, y_c, w, h) \in [0.0, 1.0]$ |
| **Micro Bounding Boxes ($< 0.02\%$ Area)** | **8 boxes (0.32%)** | $< 1\%$ | 🟢 Hairline puncture points |
| **Full-Image Bounding Boxes ($> 90\%$ Area)** | **0 boxes (0%)** | $< 2\%$ | 🟢 No blanket annotations |
| **Mean Defect Area** | **12.8% of image** | $5\% - 30\%$ | 🟢 Typical conveyor defect footprint |
| **Min Defect Area** | **0.003% of image** | — | Hairline surface mark |
| **Max Defect Area** | **84.2% of image** | — | Full-width belt transverse splice |

---

### 3. Class Instance Distribution (Entire 1,556 Images)

| Class ID | Class Name | Total Bounding Boxes | Bounding Box % | Images Containing Class | Severity Level |
| :---: | :--- | :---: | :---: | :---: | :---: |
| **0** | `belt splice` | 402 | 16.2% | 401 | **CRITICAL** |
| **1** | `deep scratch` | 379 | 15.3% | 366 | **WARNING** |
| **2** | `longitudinal tear` | 563 | 22.8% | 524 | **CRITICAL** |
| **3** | `normal belt` | 604 | 24.4% | 415 | **HEALTHY** |
| **4** | `slight scratch` | 526 | 21.3% | 457 | **INFO** |
| **Total** | | **2,474** | **100.0%** | **1,556** | |

---

### 4. Video Sequence / Grouping Discovery
* Forensic examination identified **544 unique video sequence prefixes** (e.g., `frame_00000`, `frame_00001`, `frame_20260504_*`).
* Roboflow offline augmentations (`_aug_contrast_1`, `_aug_hflip_0`) expanded the original physical recordings to 1,556 images.
* This metadata was utilized in Phase 3 to construct the **Leakage-Free Dataset Split** (`d:/SIH/anband told/leakage_free_dataset`), ensuring zero shared sequences between Train, Validation, and Test.

---

### 5. Detailed Image-Level CSV
The comprehensive per-image audit report with sequence prefixes and bounding-box area calculations is available in:
📁 [`dataset_audit_v2.csv`](file:///c:/Users/AnbuRithu/Downloads/yolo_output/dataset_audit_v2.csv)
