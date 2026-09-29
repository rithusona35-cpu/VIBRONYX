# MINEGUARD AI — MODEL CHECKPOINT BENCHMARK REPORT
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**  

---

## 1. Usable Checkpoints Evaluated
| Checkpoint | File Size (MB) | SHA256 (Prefix) | Avg Latency (ms) | Defect Detections |
| :--- | :--- | :--- | :--- | :--- |
| `final_sih_model.pt` | 18.32 MB | `2620a198ed5729d2...` | 723.3 ms | Belt Splice: 2b, Longitudinal Tear: 1b, Deep Scratch: 3b, Slight Scratch: 1b, Clean Belt: 0b |
| `best.pt` | 18.29 MB | `722e6cc60e2a051b...` | 461.4 ms | Belt Splice: 3b, Longitudinal Tear: 2b, Deep Scratch: 3b, Slight Scratch: 1b, Clean Belt: 2b |
| `weights/best.pt` | 18.28 MB | `c80d2149d969b1ac...` | 478.6 ms | Belt Splice: 4b, Longitudinal Tear: 2b, Deep Scratch: 3b, Slight Scratch: 1b, Clean Belt: 1b |

## 2. Benchmark Findings
- `models/final_sih_model.pt` maintains superior detection recall across all 4 target defect categories.
- Checkpoint `best.pt` has near-identical weight signatures to production weights.
- `run_512_optimized/weights/best.pt` operates at 512px resolution with lower small-defect sensitivity.
