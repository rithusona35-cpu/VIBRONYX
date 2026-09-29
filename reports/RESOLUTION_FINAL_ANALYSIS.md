# MineGuard AI — Resolution Final Analysis

| Resolution | Small Defect Recall | Critical Recall | CPU Latency | Memory Overhead |
| :--- | :--- | :--- | :--- | :--- |
| 640x640 | 62.5% | 88.9% | 215 ms | Low (Baseline) |
| **800x800 (Prod)** | **75.0%** | **100.0%** | **428 ms** | **Optimal** |
| 1024x1024 | 81.2% | 100.0% | 790 ms | +60% RAM |
| 1280x1280 | 83.0% | 100.0% | 1340 ms | +120% RAM |

**Conclusion**: 800x800 is the Pareto-optimal industrial operating point for real-time edge CPU inference.
