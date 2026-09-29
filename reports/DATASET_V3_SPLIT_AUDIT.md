# Dataset V3 Split & Sequence-Leakage Integrity Audit
**SIH 26008: Automated Conveyor Belt Defect Detection System**
*Dataset Directory: datasets/dataset_v3_clean_background*

---

## 1. Sequence Isolation Audit Verdict
- **Sequence Leakage Detected**: **0 instances**
- **Pipeline Integrity Status**: **PASS (100% Sequence Isolated)**
- **Physical Sequence Grouping**: Base frame hashes and all augmented variants (_aug_hflip, _aug_contrast, _aug_hvflip, _aug_vflip, _resized, _cropped) are strictly confined as atomic units to their respective split. No physical frame variant crosses dataset boundaries.

---

## 2. Partition Summary Statistics

| Partition | Total Images | Total Annotations | Distinct Physical Frames | Empty Labels (True Negatives) | Missing Labels |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Train** | 1175 | 1402 | 484 | 112 | 0 |
| **Validation** | 191 | 249 | 81 | 16 | 0 |
| **Test** | 190 | 212 | 78 | 17 | 0 |
| **Total** | **1556** | **1863** | **643** | **145** | **0** |

---

## 3. Class Annotation Distribution in Dataset V3
- **Class 0 (Belt Splice)**: 402 bounding boxes
- **Class 1 (Deep Scratch)**: 378 bounding boxes
- **Class 2 (Longitudinal Tear)**: 560 bounding boxes
- **Class 3 (Normal Belt - Intact Target)**: 0 bounding boxes (clean background regions converted to negative samples)
- **Class 4 (Slight Scratch)**: 523 bounding boxes

---

## 4. Image Corruption & Duplicate Analysis
- **Corrupted Images**: 0 (0.00% across all splits)
- **Missing Label Files**: 0 (0.00% across all splits)
- **Duplicate / Overlapping Cross-Split Images**: 0 (Verified via perceptual and base identifier hash match)
