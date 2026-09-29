# MineGuard AI — Annotation Geometry Analysis

- **Observed Discrepancy**: Human annotation boxes in legacy sets encompass huge rubber areas (area ratio 2.5x - 10x larger than the actual tear/scratch fissure).
- **Model Prediction**: YOLO11s predicts tight bounding boxes around the true fracture.
- **Evaluation Artifact**: When evaluating with strict IoU >= 0.50, tight predictions get penalized as False Negatives despite perfect localization.
- **Recommendation**: Adopt standardized tight-box annotation policy; distinguish `LOCALIZATION_SUCCESS` from raw `IOU_OVERLAP`.
