# MINEGUARD AI — THRESHOLD SENSITIVITY ANALYSIS
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**  

---

## 1. Threshold Sweep Results
| Confidence Threshold | Defect Recall | Recall % | Clean Belt False Alarms | Recommended Mode |
| :--- | :--- | :--- | :--- | :--- |
| 0.10 | 4/4 | 100% | 2 | HIGH_RECALL_AUDIT |
| 0.15 | 4/4 | 100% | 1 |  |
| 0.20 | 4/4 | 100% | 1 |  |
| 0.25 | 4/4 | 100% | 0 | **DEMO_DEFECT_SENSITIVITY (PRODUCTION DEFAULT)** |
| 0.30 | 4/4 | 100% | 0 |  |
| 0.35 | 4/4 | 100% | 0 |  |
| 0.40 | 3/4 | 75% | 0 | CONSERVATIVE_INSPECTION |
| 0.45 | 3/4 | 75% | 0 |  |
| 0.50 | 3/4 | 75% | 0 |  |
| 0.55 | 3/4 | 75% | 0 |  |
| 0.60 | 3/4 | 75% | 0 |  |

## 2. Tradeoff Analysis
- **Threshold 0.25:** Optimal balance; captures 100% of critical defects (Splice & Tear) while generating 0 false alarms on clean conveyor rubber.
- **Threshold 0.10:** Recommended for secondary inspection on challenging high-aspect-ratio images.
