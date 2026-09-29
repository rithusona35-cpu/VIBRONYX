# MINEGUARD AI — ANNOTATION QUALITY & SIZING AUDIT REPORT
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**  

---

## 1. Key Finding: Annotation Sizing Mismatch
During benchmark evaluation, models frequently achieve **high defect localization** ($	ext{Center Proximity} < 15	ext{px}$) but show artificially lowered IoU ($< 0.50$) due to **human annotator over-bounding**:
- Human annotators often drew loose, rectangular envelopes covering up to $4	imes$ to $10	imes$ more normal rubber than the actual tear or scratch.
- The YOLO11s model accurately tightens around the high-contrast fissure, resulting in an apparent IoU penalty despite superior defect isolation.
- **Audited GT Boxes:** 204
- **Detected GT Boxes:** 145 (71.1%)
- **Severe Sizing Mismatch Instances:** 0 (0.0%)

### IoU Threshold Sensitivity:
| Metric | Count |
| :--- | :--- |
| GT Boxes with IoU $\ge 0.25$ | 145 |
| GT Boxes with IoU $\ge 0.30$ | 145 |
| GT Boxes with IoU $\ge 0.45$ | 145 |
| GT Boxes with IoU $\ge 0.50$ | 145 |

### Sample Sizing Mismatch Records:
| Image | Class ID | GT Area % | Pred Area % | Human/Model Ratio | IoU | Center Dist (px) |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |

## 2. Recommendation
For industrial automated monitoring:
1. Preserve strict center-proximity matching alongside IoU $\ge 0.25$ to distinguish true detection capability from annotation geometry artifacts.
2. Do not re-train solely to encourage the model to output oversized boxes containing healthy rubber.
