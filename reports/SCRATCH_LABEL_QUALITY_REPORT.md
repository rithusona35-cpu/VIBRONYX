# Scratch Dataset Label Quality Audit & Correction List
**SIH 26008: Annotation Quality Control & Proposal**

---

## 1. Quality Issues Identified in Legacy Scratch Annotations
1. **Micro-Bounding Boxes (<0.001 Normalized Area)**:
   - 12 instances where scratch annotations covered only 1–2 pixels, causing extreme loss spikes during box regression.
   - Action: Exclude sub-pixel annotation noise from regression targets.
2. **Cross-Class Ambiguity between Deep and Slight Scratches**:
   - 23 borderline instances where depth is visually unresolvable in 2D monochrome.
   - Action: Categorize by surface width (<2mm = Slight, >=2mm = Deep).
3. **Boxes Covering Clean Background Rubber**:
   - 8 instances where scratch bounding boxes encompassed large undamaged rubber borders.
   - Action: Tighten polygon/box coordinates to defect margins.

---

## 2. Proposed Annotation Correction List (For Future Dataset Releases)
| Image Filename | Defect Class | Anomaly Description | Recommended Action |
| :--- | :--- | :--- | :--- |
| `frame_00012_jpg.rf.0bccc92f2975e1b5d666489e29c08648.jpg` | Slight Scratch | Tiny box (<4px width) | Merge with primary longitudinal wear track |
| `frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg` | Deep Scratch | Overlapping tear boundary | Retain tear annotation as primary structural hazard |
| `frame_00046_jpg.rf.9075689b3baa501f6d8d9f1d91930a32.jpg` | Slight Scratch | Hairline abrasion under specular glare | Calibrate confidence threshold to 0.25 |
| `frame_00078_jpg.rf.7719d1d835cab947ea466cdf7469001a.jpg` | Slight Scratch | Ambiguous edge groove | Preserve as INFO severity |
