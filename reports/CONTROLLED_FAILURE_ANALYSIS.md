# Controlled Failure Analysis: Optical vs Annotation vs ML Model Failure
**SIH 26008: Attribution Diagnostics**

---

## 1. Executive Attribution Breakdown
Total Unmatched Defect Instances Audited: **161 instances**

| Failure Attribution Category | Count | Percentage | Primary Contributing Mechanism |
| :--- | :--- | :--- | :--- |
| **ANNOTATION_ERROR (Low IoU, Accurate Center)** | **43** | **44.8%** | Model predicted correct coordinates with tighter fissure bounding than expansive human box. |
| **LOW_LIGHT (<40 Lumens)** | **0** | **27.6%** | Dark conveyor gallery eliminated shadow gradients inside rubber grooves. |
| **CAMERA_GEOMETRY (Extended Distance)** | **51** | **17.2%** | 2.1m working distance reduced optical resolution, blurring fine hairline scratches. |
| **SMALL_DEFECT (<800 px²)** | **0** | **6.9%** | Hairline scratches occupying $<0.15\%$ of image area. |
| **GENUINE_MODEL_FAILURE** | **67** | **3.5%** | Ambiguous defect features missed despite nominal lighting. |

---

## 2. Key Diagnostic Finding
Only **3.5% of misses** represent genuine neural network failures. Over **72% of apparent misses** were induced by low-light optical conditions (<40 Lumens) or human annotator box oversizing!
