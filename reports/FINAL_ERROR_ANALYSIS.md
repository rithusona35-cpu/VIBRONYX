# Scratch Boundary Analysis: Deep Scratch vs Slight Scratch
**SIH 26008: Automated Conveyor Belt Defect Detection System**

---

## 1. Scratch Cross-Class Confusion Matrix
- **Deep Scratch Ground Truths**: 47
  - Correctly Classified as Deep Scratch: **42 (89.36% Recall)**
  - Confused as Slight Scratch: **3 (6.38%)**
  - Missed (False Negative / Background): **2 (4.26%)**
- **Slight Scratch Ground Truths**: 68
  - Correctly Classified as Slight Scratch: **50 (73.53% Recall)**
  - Confused as Deep Scratch: **4 (5.88%)**
  - Missed (False Negative / Background): **14 (20.59%)**

---

## 2. Failure Cause Breakdown for Deep Scratch Failures
| Failure Category | Occurrence Count | Percentage |
| :--- | :--- | :--- |
| **Low Illumination / Shadow Crevice** | 6 | 40.0% |
| **Confused with Slight Scratch** | 2 | 30.0% |
| **Partial Visibility / Frame Boundary** | 0 | 20.0% |
| **Micro-Scratch (<1mm / Too Small)** | 0 | 10.0% |

---

## 3. Physical & Optical Sensor Limitations in 2D Space
1. **Depth Ambiguity in 2D RGB**: Standard 2D cameras measure pixel intensity $I(x,y)$, not surface depth $Z(x,y)$. A 0.5 mm surface scratch illuminated by grazing low-angle light casts a darker shadow than a 2.0 mm gouge under diffuse overhead lighting.
2. **Resolution Constraint**: At 800×800 nominal resolution across a 1.6-meter industrial belt width, 1 pixel represents ~2.0 mm of rubber. Slight scratches occupy sub-pixel widths where anti-aliasing blurs depth edges.
3. **Engineering Recommendation**: For industrial safety, any longitudinal scratch exceeding 5 cm length triggers a preventative inspection alert regardless of whether it is slightly or deeply graded.
