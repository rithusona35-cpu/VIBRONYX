# Dataset Quality Audit Report V2 — MineGuard AI
**SIH Problem Statement:** SIH 26008 — Conveyor Belt Defect Detection  
**Source Dataset:** `D:/SIH/anband told/belt predutor`  
**Audited Images:** 1556  
**Audited Annotations:** 2474  

---

## 1. Split Distribution (Original Dataset)

| Split | Images | Annotations | Corrupt | Empty / Background | Mean Boxes / Img |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Train** | 1363 | 2126 | 0 | 0 | 1.56 |
| **Validation** | 122 | 218 | 0 | 0 | 1.79 |
| **Test** | 71 | 130 | 0 | 0 | 1.83 |
| **Total** | **1556** | **2474** | **0** | **0** | **1.59** |

---

## 2. Identified Annotation Anomalies

1. **Normal Belt False Positive Inducer:** 604 Normal Belt boxes existed across the dataset. In 380+ images, annotators drew `normal_belt` boxes around healthy rubber adjacent to tears or splices on the same frame, training the model to predict Normal Belt even when active tears are present.
2. **Micro-Bounding Boxes (<0.02% Area):** 8 hairline speckle annotations were identified.
3. **Data Leakage Across Naive Splits:** The original dataset contains consecutive video frames with offline augmentations (`_aug_contrast`, `_aug_hflip`) scattered between train, val, and test.
