# DATASET_SPLIT_REPORT.md
## Dataset Split Verification & Integrity Report

### 1. Split Allocation
* **Train Split**: 1,363 images (2,126 annotations)
* **Validation Split**: 122 images (218 annotations)
* **Test Split**: 71 images (130 annotations)
* **Integrity Status**: **PASS** (Zero file corruption, zero missing labels, zero coordinate overflow)

---

### 2. Per-Class Representation per Split

```
TRAIN (2,126 annotations):
  ├── belt_splice        : 370 boxes (17.4%) in 370 images
  ├── deep_scratch       : 332 boxes (15.6%) in 320 images
  ├── longitudinal_tear  : 482 boxes (22.7%) in 452 images
  ├── normal_belt        : 470 boxes (22.1%) in 319 images
  └── slight_scratch     : 472 boxes (22.2%) in 406 images

VALIDATION (218 annotations):
  ├── belt_splice        :  15 boxes ( 6.9%) in  15 images
  ├── deep_scratch       :  28 boxes (12.8%) in  27 images
  ├── longitudinal_tear  :  51 boxes (23.4%) in  45 images
  ├── normal_belt        :  92 boxes (42.2%) in  62 images
  └── slight_scratch     :  32 boxes (14.7%) in  29 images

TEST (130 annotations):
  ├── belt_splice        :  17 boxes (13.1%) in  16 images
  ├── deep_scratch       :  19 boxes (14.6%) in  19 images
  ├── longitudinal_tear  :  30 boxes (23.1%) in  27 images
  ├── normal_belt        :  42 boxes (32.3%) in  34 images
  └── slight_scratch     :  22 boxes (16.9%) in  22 images
```

---

### 3. Leakage & Overlap Audit
* **Exact Duplicate Image Hash Cross-Check**: MD5 fingerprinting detected **0 overlapping images** across splits.
* **Leakage Status**: **ZERO LEAKAGE DETECTED**. The test split has been preserved independently.

---

### 4. Split Report CSV
Exported data available at:
📁 [`dataset_split_report.csv`](file:///c:/Users/AnbuRithu/Downloads/yolo_output/dataset_split_report.csv)
