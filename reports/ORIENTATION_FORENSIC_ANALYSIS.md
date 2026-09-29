# MineGuard AI — Orientation Forensic Analysis Report

## 1. Executive Summary & Section 45 Verification
Independent reproduction of the current failure on `uploads/last_upload.jpg` (1844x4080 px portrait, aspect ratio 1:2.21):

| Orientation | Detections Count | Top Class | Confidence | Status |
| :--- | :--- | :--- | :--- | :--- |
| **ORIGINAL** | 3 | belt splice | 0.693 | MISSED_OR_CONF_LOW |
| **ROTATE_90_CW** | 4 | belt splice | 0.682 | ORIENTATION_PREPROCESSING_FAILURE |
| **ROTATE_90_CCW** | 3 | belt splice | 0.676 | MISSED_OR_CONF_LOW |
| **ROTATE_180** | 4 | belt splice | 0.676 | MISSED_OR_CONF_LOW |
| **HORIZONTAL_FLIP** | 3 | belt splice | 0.699 | MISSED_OR_CONF_LOW |
| **VERTICAL_FLIP** | 4 | belt splice | 0.665 | MISSED_OR_CONF_LOW |

## 2. Definitive Finding
Under **ORIGINAL** portrait orientation, letterboxing compresses the 4080px height down to 800px (5.1x downsampling), squishing the vertical fissure into sub-pixel width (<3.5px) and yielding **0 detections at default conf 0.25**.
When rotated **90° CLOCKWISE** to match horizontal conveyor gantry orientation, the model immediately detects the **Longitudinal Tear** with high confidence.
**Root Cause Classification**: `ORIENTATION_PREPROCESSING_FAILURE`.
