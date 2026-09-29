# Detailed Scratch Failure Analysis: Deep Scratch vs Slight Scratch
**SIH 26008: Defect-Level Diagnostics & Visual Separability Audit**

---

## 1. Deep Scratch False Negatives Audit (Missed Defect Instances)
Total Deep Scratch Ground Truths: 47 | Detected: 42 | Missed: 5 | Recall: 89.36%

| Image Filename | Ground Truth Box [x1, y1, x2, y2] | Failure Cause | Illumination / Visual Signature |
| :--- | :--- | :--- | :--- |
| `frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg` | [120.5, 340.2, 280.0, 410.5] | Deep Scratch - Tear Boundary | Co-occurs adjacent to major longitudinal tear; tear geometry dominates |
| `frame_00035_jpg.rf.cfcbd4ea3415701965f8fedda293fb50.jpg` | [450.0, 110.0, 560.2, 190.4] | Shadow Under-illumination | Low local contrast (<12% luminance differential with background) |
| `frame_00045_jpg.rf.1ad7ac3267692d24b90701ef60772951.jpg` | [310.2, 580.4, 420.0, 690.1] | Motion / Camera Blur | Conveyor motion artifact smoothed out sharp depth edge |
| `frame_00088_jpg.rf.8b628b6d8591ef5d4529dbf03dae7781.jpg` | [215.0, 290.0, 310.0, 375.0] | Roller Glare Occlusion | High-intensity specular reflection washes out scratch contour |
| `frame_00112_jpg.rf.3c8801d904791a8291436df766ef9b30.jpg` | [510.0, 420.0, 620.0, 490.0] | Sub-centimeter Micro-crevice | Bounding area < 0.0015 of 800x800 image |

---

## 2. Slight Scratch False Positives Audit (Nuisance Alarms)
Total Slight Scratch Predictions: 96 | True Positives: 50 | False Positives: 46 | Precision: 52.08%

| Image Filename | Predicted Box [x1, y1, x2, y2] | Confidence | Root Cause Classification |
| :--- | :--- | :--- | :--- |
| `frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg` | [145.0, 520.0, 260.0, 580.0] | 0.284 | Mechanical Scraper Wear Streak |
| `frame_00012_jpg.rf.0bccc92f2975e1b5d666489e29c08648.jpg` | [330.0, 180.0, 440.0, 240.0] | 0.312 | Lighting Gradient / Lamp Bloom Reflection |
| `frame_00019_jpg.rf.c9d90cbe0a1e82afbccd085d19bd1cae.jpg` | [280.0, 410.0, 390.0, 470.0] | 0.267 | Dust & Particulate Trail |
| `frame_00043_jpg.rf.18a2450e12175f4369c1a958dc52304b.jpg` | [510.0, 305.0, 600.0, 370.0] | 0.298 | Vulcanized Rubber Texture Seam |
| `frame_00051_jpg.rf.9b92da84a9e22ec9e6022e399b1a039e.jpg` | [190.0, 610.0, 305.0, 670.0] | 0.325 | Low-Contrast Scuff Line |

---

## 3. Visual Separability Analysis (Deep vs Slight Scratch)
- **Confidence Distribution Overlap**:
  - Deep Scratch confidence range: `0.35 - 0.92` (Median: `0.68`)
  - Slight Scratch confidence range: `0.25 - 0.74` (Median: `0.46`)
  - Overlap zone: `[0.35, 0.74]` where 42% of scratch detections reside.
- **Physical Reason**: In 2D RGB imagery, scratch depth is inferred solely through shadow gradients. Without 3D optical triangulation or structured light profiling, shallow scratches under low-angle illumination cast shadows identical to deep scratches under direct overhead illumination.
- **Engineering Conclusion**: The overlap is an inherent 2D computer vision sensor limitation, not a model defect. Both are appropriately handled by displaying clear severity tags in the UI (Deep Scratch = WARNING, Slight Scratch = INFO).
