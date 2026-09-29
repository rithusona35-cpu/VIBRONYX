# Dual-View Model Evaluation: Strict 5-Class vs Defect-Only
**SIH 26008: Conveyor Belt Defect Inspection Benchmark**
*Evaluation Split: `datasets/dataset_v2_5class/val` (191 sequence-isolated images, 331 annotations)*
*Protocol: Identical input size (800x800), Conf=0.25, IoU=0.50, Same Metric Pipeline*

---

## 1. Dual-View Benchmark Comparison Matrix

| Model Identifier | View A: 5-Class Precision | View A: 5-Class Recall | View A: 5-Class F1 | View B: Defect-Only Precision | View B: Defect-Only Recall | View B: Defect-Only F1 | Belt Splice Recall | Longitudinal Tear Recall | Deep Scratch Recall | Slight Scratch Recall | Normal Belt Recall |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Current Production (`final_sih_model.pt`)** | **77.31%** | **74.19%** | **0.7572** | **77.17%** | **88.76%** | **0.8256** | **100.0%** (41/41) | **94.62%** (88/93) | **89.36%** (42/47) | **73.53%** (50/68) | 13.41% (11/82) |
| **Candidate B (`candidate_B_v3.pt`)** | 81.48% | 65.81% | 0.7281 | 80.95% | 79.52% | 0.8023 | 95.12% (39/41) | **76.91%** (71/93) | 89.36% (42/47) | 67.65% (46/68) | 0.00% (Clean bg) |
| **Baseline Model (`best.pt`)** | 75.68% | 71.61% | 0.7359 | 75.10% | 86.35% | 0.8035 | 100.0% (41/41) | 94.62% (88/93) | 87.23% (41/47) | 67.65% (46/68) | 8.54% (7/82) |

---

## 2. SIH Architectural & Industrial Insights
1. **View A (Strict 5-Class)**:
   - Evaluates all classes including Normal Belt as a bounding box requirement.
   - Because Normal Belt represents ambient clean rubber background rather than a localized defect, unpredicted Normal Belt regions depress overall recall down to 74.19%.
2. **View B (Defect-Only Benchmark)**:
   - Evaluates only true structural hazards: Belt Splice, Longitudinal Tear, Deep Scratch, Slight Scratch.
   - The production model achieves an outstanding **88.76% defect recall** and **0.8256 F1 score** across 249 actual defect ground-truth instances.
3. **Candidate B Disqualification Root Cause**:
   - Training on cleaned-background data without Normal Belt bounding boxes forced the model to hallucinate or misclassify Longitudinal Tears, causing a disastrous **17.71% collapse in Longitudinal Tear recall** (missing 22 tears vs only 5 missed by production). This violates Critical Defect Safety Gate 2.
