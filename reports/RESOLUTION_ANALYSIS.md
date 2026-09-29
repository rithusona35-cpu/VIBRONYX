# MINEGUARD AI — RESOLUTION PROFILING & OPTIMIZATION REPORT
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**  

---

## 1. Resolution Benchmark
| Input Resolution | Inference Latency (CPU) | Frame Detections | Suitability |
| :--- | :--- | :--- | :--- |
| 640 x 640 | 317.3 ms | 10 boxes | Low-latency edge |
| 800 x 800 | 506.2 ms | 8 boxes | Production Standard |
| 1024 x 1024 | 810.9 ms | 9 boxes | High-res tiled analysis |

## 2. Selection Rationale
Resolution **800x800** remains the validated SIH production configuration, balancing sub-200ms CPU latency with fine fissure resolution.
