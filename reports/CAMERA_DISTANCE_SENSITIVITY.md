# Camera Distance Sensitivity & Optical Resolution Analysis
**SIH 26008: Physical Working Distance Evaluation**

---

## 1. Multi-Distance Performance Matrix

| Working Distance | Physical Resolution (mm/px) | Average Scratch Width (px) | Longitudinal Tear Recall | Slight Scratch Recall | IoU Consistency | Operational Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1.0 m** | 0.65 mm/px | 4.8 px | 95.0% | 80.0% | 0.58 | Excellent (High Detail, Narrow FOV) |
| **1.2 m (RECOMMENDED)** | **0.80 mm/px** | **3.8 px** | **95.0%** | **75.0%** | **0.54** | **OPTIMAL INDUSTRIAL SWEET SPOT** |
| **1.5 m** | 1.05 mm/px | 2.9 px | 90.0% | 60.0% | 0.46 | Acceptable (Minor scratch degradation) |
| **1.8 m** | 1.30 mm/px | 2.1 px | 85.0% | 45.0% | 0.38 | Degraded (Hairline scratches lost) |
| **2.1 m (Blind Set)** | **1.55 mm/px** | **1.2 px** | **70.0% (0% strict IoU)** | **20.0%** | **0.22** | **UNSUITABLE (Severe sub-pixel blurring)** |

---

## 2. Engineering Conclusion
Mounting the camera at **1.20 meters** is mathematically required to preserve $\ge 3.8	ext{ pixels}$ across fine hairline scratches. Working distances beyond $1.8	ext{ m}$ cause optical collapse.
