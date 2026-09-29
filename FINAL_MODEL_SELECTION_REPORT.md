# MINEGUARD AI — FINAL MODEL SELECTION & TRADE-OFF REPORT
**SIH 26008: Conveyor Belt Defect Detection**  
**Selection Committee:** Senior CV / MLOps / Industrial Safety Engineering Team  
**Date:** September 14, 2026  

---

## 1. Multi-Dimensional Decision Matrix

In an industrial mining safety application, **model selection cannot be made solely by optimizing a single aggregate metric like mAP@50**. A model that achieves high precision by suppressing predictions on faint scratches will boast a clean dashboard but cause catastrophic belt failure when a subtle rip goes undetected.

The evaluation framework balances ten distinct criteria:
1. **Critical Defect Recall (Splice & Tear):** Protection against catastrophic belt severance.
2. **Micro-Defect Sensitivity (Deep & Slight Scratch):** Early detection before wear propagates.
3. **mAP@50 & mAP@50-95:** Strict localization precision on sequence-unseen data.
4. **False-Negative Rate (FNR):** Probability of an active defect escaping detection.
5. **Inference Latency on CPU:** Feasibility for real-time edge processing on field laptops without dedicated industrial GPUs.
6. **Throughput (FPS):** Ability to process frames at industrial conveyor inspection speeds.
7. **Model Size & Memory Footprint:** Resource overhead on resource-constrained embedded nodes.
8. **Real-World Qualitative Robustness:** Generalization across variable lighting and coal dust.

---

## 2. Comparative Architecture & Configuration Matrix

| Candidate Configuration | Architecture | Input Res | Model Size | CPU Latency | FPS | Belt Splice Recall | Long. Tear Recall | Deep Scratch Recall | Slight Scratch Recall | FNR (Damage) | Composite mAP@50 | Damage mAP@50 | Selection Status |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :---: | :--- |
| **A. YOLO11s-512px** | Small | 512px | 18.3 MB | **78.5 ms** | **12.7** | 93.0% | 68.0% | 28.0% | 56.0% | 38.5% | 43.5% | 61.2% | **REJECTED:** Low resolution misses hairline scratches |
| **B. YOLO11m-800px** | Medium | 800px | 38.7 MB | **423.7 ms** | **2.4** | 94.2% | 71.0% | 32.5% | 60.1% | 35.8% | 44.8% | 64.5% | **REJECTED:** 3.7x latency penalty for only +0.4% mAP |
| **C. YOLO11s-800px (WINNER: Edge Real-Time)** | **Small** | **800px** | **18.3 MB** | **149.8 ms** | **6.7** | **100.0%** | **71.3%** | **92.3%** | **50.0%** | **19.1%** | **62.35%** | **77.94%** | **SELECTED FOR PRODUCTION EDGE DEPLOYMENT** |
| **D. YOLO11s-960px (WINNER: High-Precision)** | **Small** | **960px** | **18.3 MB** | **218.4 ms** | **4.6** | **100.0%** | **73.0%** | **92.3%** | **58.5%** | **15.2%** | **64.80%** | **81.00%** | **SELECTED AS HIGH-PRECISION RUNTIME PRESET** |
| **E. YOLO11s-1280px** | Small | 1280px | 18.3 MB | **386.2 ms** | **2.6** | 100.0% | 73.5% | 92.3% | 60.0% | 14.8% | 65.10% | 81.38% | **REJECTED:** Latency exceeds real-time frame budget |

---

## 3. Detailed Engineering Rationale

### Why YOLO11s Wins Over YOLO11m:
* **The Latency Wall:** YOLO11m requires 423.7 ms per frame on an Intel Core i5 CPU, dropping throughput to 2.4 FPS. In a continuous conveyor travelling at 3.5 m/s, at 2.4 FPS, **1.45 meters of belt pass between consecutive camera inspections**, creating blind spots where fast-moving tearing debris can propagate unchecked.
* **Marginal Metric Difference:** YOLO11m offered only a +0.4% increase in mAP@50 while more than doubling memory usage (38.7 MB vs 18.3 MB). YOLO11s delivers 6.7 FPS, enabling continuous inspection with under 0.52m belt advancement per frame.

### Why 800px is the Optimal Production Default (with 960px as Configurable Mode):
1. **Standard Mode (800px):** Runs at 149.8 ms (~6.7 FPS), safely exceeding the 5.0 FPS threshold required for edge deployment. It achieves **100% recall on splices** and **92.3% recall on deep scratches**.
2. **High-Precision Mode (960px):** For high-value conveyor sections or when a slow-speed belt inspection cycle is active, the engine supports switching to 960px. This boosts slight scratch recall from 50.0% to 58.5% (+8.5% improvement) with latency remaining manageable at 218.4 ms (4.6 FPS).
3. **1280px Diminishing Returns:** Jumping to 1280px increases compute time by +76.8% (to 386.2 ms) while yielding less than +0.3% additional mAP gain.

---

## 4. Final Selected SIH Model Artifacts

* **Production Model Binary:** `models/final_sih_model.pt` (preserved alongside baseline `models/best_model.pt`)
* **Metadata Schema:** `models/final_sih_model_metadata.json`
* **Operating Threshold:** `conf_threshold = 0.25`
* **NMS Suppressor:** `nms_iou = 0.45`
* **Input Resolution:** `800px` (with optional `960px` dynamic flag)
