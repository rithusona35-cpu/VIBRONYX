# Model Selection Gate Report: Production vs Candidate B
**SIH 26008: Conveyor Belt Defect Detection System**
*Date: 2026-09-18*

---

## 1. Executive Summary & Selection Decision
- **Production Model**: `models/final_sih_model.pt` (YOLO11s, 18.32 MB)
- **Candidate B Model**: `models/candidates/candidate_B_v3.pt` (YOLO11s, 19.15 MB)
- **Final Decision**: **KEEP PRODUCTION MODEL (`final_sih_model.pt`) IN PRODUCTION. REJECT CANDIDATE B.**

---

## 2. Quantitative Comparison Table

| Performance Metric | Production Model (`final_sih_model.pt`) | Candidate B (`candidate_B_v3.pt`) | Delta (Candidate B - Prod) | Selection Verdict |
| :--- | :--- | :--- | :--- | :--- |
| **Precision** | **77.31%** | 81.48% | +4.17% | Improved |
| **Recall** | **74.19%** | 65.81% | **-8.38%** | **SEVERE REGRESSION** |
| **F1 Score** | **0.7572** | 0.7281 | **-0.0291** | Regression |
| **mAP@50** | **68.15%** | 65.14% | **-3.01%** | Regression |
| **mAP@50-95** | **37.15%** | 33.30% | **-3.85%** | Regression |
| **Belt Splice Recall** | **100.0% (41/41)** | **95.12% (39/41)** | **-4.88%** | **FAILS GATE 1** |
| **Longitudinal Tear Recall** | **94.62% (88/93)** | **76.91% (72/93)** | **-17.71%** | **FAILS GATE 2 (CATASTROPHIC)** |
| **Deep Scratch Recall** | **89.36% (42/47)** | 89.36% (42/47) | 0.00% | Neutral |
| **Slight Scratch Recall** | **73.53% (50/68)** | **67.65% (46/68)** | **-5.88%** | **FAILS GATE 4** |
| **Clean Frame False Alarm** | **0.0% (0/1)** | 0.0% (0/1) | 0.00% | Neutral |
| **Real-World Defect Recall** | **100.0% (11/11)** | 100.0% (11/11) | 0.00% | Neutral |
| **CPU Latency (PyTorch)** | **168.2 ms** | 175.4 ms | +7.2 ms | Neutral |

---

## 3. Why Candidate B Was Rejected
1. **Critical Defect Failure (Longitudinal Tears)**: In industrial mining conveyor applications, a missed longitudinal tear results in catastrophic belt rupture, costing hundreds of thousands of dollars in downtime. Candidate B missed **21 longitudinal tears** (76.91% recall) compared to only 5 missed by the production model (94.62% recall). This violated Gate 2.
2. **Belt Splice Recall Drop**: Candidate B missed 2 belt splices (95.12% recall), whereas the production model achieved **100.0% recall** with zero missed splices across all evaluations.
3. **Slight Scratch Degradation**: Slight scratch recall dropped from 73.53% to 67.65%.
4. **False Economy of Precision**: While Candidate B achieved higher raw precision (81.48% vs 77.31%), it did so by aggressively suppressing low-confidence predictions, which sacrificed 8.38% overall recall and 17.7% tear recall.
