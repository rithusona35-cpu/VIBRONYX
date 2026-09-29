# DATASET_AUDIT.md
## Comprehensive Dataset Audit Report — MineGuard AI (SIH 26008)

### 1. Dataset Overview & Inventory
* **Dataset Location**: `D:\SIH\anband told`
* **Format**: YOLO v1.1 Annotation Format (Normalized `[class_id, x_center, y_center, width, height]`)
* **Total Image Files**: **1,556 images**
* **Total Label Files**: **1,556 files**
* **Total Bounding Box Annotations**: **2,474 boxes**
* **Image Dimensions**: $800 \times 800$ px (Standardized across all splits)
* **Corrupted Image Files**: **0** (100% verified readable by OpenCV/PIL)
* **Missing Label Files**: **0**
* **Empty Label Files**: **0**
* **Data Leakage (Exact Duplicates across splits)**: **0 cases** (Verified via MD5 checksum hashing)

---

### 2. Class Distribution Across Splits

| Class ID | Class Name | Train Annotations | Valid Annotations | Test Annotations | Total Annotations | % of Dataset |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| **0** | `belt_splice` | 370 | 15 | 17 | **402** | 16.2% |
| **1** | `deep_scratch` | 332 | 28 | 19 | **379** | 15.3% |
| **2** | `longitudinal_tear` | 482 | 51 | 30 | **563** | 22.8% |
| **3** | `normal_belt` | 470 | 92 | 42 | **604** | 24.4% |
| **4** | `slight_scratch` | 472 | 32 | 22 | **526** | 21.3% |
| **Total** | | **2,126** | **218** | **130** | **2,474** | **100.0%** |

---

### 3. Split Distribution Analysis

| Split | Image Count | Image % | Annotation Count | Annotation % | Avg Boxes/Image |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Train** | 1,363 | 87.6% | 2,126 | 85.9% | 1.56 |
| **Validation** | 122 | 7.8% | 218 | 8.8% | 1.79 |
| **Test** | 71 | 4.6% | 130 | 5.3% | 1.83 |
| **Total** | **1,556** | **100%** | **2,474** | **100%** | **1.59** |

*Note: Train contains Roboflow offline augmentations (horizontal flips, contrast adjustments), expanding the original base training images (~454) to 1,363.*

---

### 4. Annotation Quality & Anomaly Analysis

Out of 2,474 annotations across 1,556 images:
* **Coordinates Validity**: 100% of bounding box center coordinates $(x_c, y_c)$ fall strictly within $[0.0, 1.0]$.
* **No Out-of-Bound Coordinates**: Zero boxes extend negatively or exceed image boundaries.
* **Micro-box Outliers**: Only 8 images (0.5%) contain micro-annotations (box area $< 0.01\%$ of image). These represent tiny hairline puncture points.
* **Identified Class Imbalance in Evaluation Sets**:
  - `normal_belt` accounts for **42.2%** of all validation boxes (92 boxes) and **32.3%** of all test boxes (42 boxes).
  - `belt_splice` has only 15 instances in validation and 17 in test.
  - Because `normal_belt` is predominantly background texture, when the model predicts no box for a normal belt, it is penalized as a False Negative in mAP calculations.

---

### 5. Detailed Audit CSV
The full per-image audit report has been exported to:
📁 [`dataset_audit.csv`](file:///c:/Users/AnbuRithu/Downloads/yolo_output/dataset_audit.csv)
