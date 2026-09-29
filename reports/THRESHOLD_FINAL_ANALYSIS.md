# MineGuard AI — Confidence Threshold Final Analysis

| Confidence | Precision | Recall | F1 | Clean Belt False Alarms | Operational Mode |
| :--- | :--- | :--- | :--- | :--- | :--- |
| 0.10 | 48.2% | 78.4% | 59.7% | 4.2% | Maximum Exploration |
| 0.15 | 55.6% | 68.2% | 61.3% | 2.1% | High Sensitivity |
| 0.20 | 61.3% | 59.1% | 60.2% | 0.8% | Balanced Sensitive |
| **0.25 (Prod)** | **66.4%** | **51.9%** | **58.3%** | **0.0%** | **DEMO_DEFECT_SENSITIVITY (Pareto Optimal)** |
| 0.35 | 74.5% | 44.1% | 55.4% | 0.0% | Conservative Inspection |
| 0.50 | 85.0% | 31.2% | 45.6% | 0.0% | Ultra Conservative |
