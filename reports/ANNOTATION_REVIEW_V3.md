# Dataset Quality Control & Annotation Review V3
**MineGuard AI — Dataset Integrity Verification**

## 1. Normal Belt Annotation Audit
- **Legacy Normal Belt Box Count**: 604 bounding boxes.
- **Background Normal Belt Regions**: 578 annotations simply boxed clean rubber. In object detection, assigning boxes to background regions penalizes models for zero-detection scans and induces false alarms.
- **Contextual Useful Regions**: 26 annotations bordered transitions between rubber types or testbench edges.
- **Overlapping/Adjacent Boxes**: 114 instances where a Normal Belt box overlapped directly with or was adjacent to a real defect (Tear or Splice).

## 2. Dataset V3 Clean Background Formulation
- `datasets/dataset_v3_clean_background/` was created non-destructively.
- Confirmed background Normal Belt boxes were removed from label files.
- The underlying images were fully preserved as true negative background examples (0 annotations), providing negative gradients without contradictory anchor targets.
