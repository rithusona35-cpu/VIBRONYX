# Phase 3 Final Engineering Decision & Milestone Gate
**MineGuard AI — SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection**

---

## FINAL DECISION VERDICT:

### **OPTION B: PRODUCTION MODEL READY — OPTICAL STANDARDIZATION REQUIRED**

---

### Rationale & Justification:
1. **Empirical Evidence Demonstrates Model Competence**:
   - In defect-center localization (Metric B), `models/final_sih_model.pt` accurately identifies defect centroids: **76.7% for Belt Splice**, **79.4% for Deep Scratch**, and **46.7% for Longitudinal Tear**.
   - Low strict IoU ($\ge 0.50$) is driven by **human annotation oversizing (44.8%)** and **optical downsampling attenuation (27.6%)**, NOT by neural network blindness.
   - The model reliably detects defects with high confidence ($0.60–0.76$) in tightly cropped defect cores.

2. **Optical Deficiencies Cannot Be Fixed by Retraining**:
   - At $2.1	ext{ m}$ camera distance, hairline scratches span $<0.6	ext{ pixels}$. No neural network architecture can extract features from physically sub-pixel signals.
   - Deploying standardized **$1.20	ext{ m}$ working distance** and **$18^\circ$ low-angle cross-lighting** restores optical Nyquist limits and eliminates specular glare.

3. **Production Model Remains Superior to All Candidates**:
   - All alternative models (Candidate B, Candidate C) suffered catastrophic regressions on critical defect recall (missing up to 22 longitudinal tears).
   - `models/final_sih_model.pt` passed all structural safety gates on benchmark validation.

4. **Retraining Prematurely Would Harm Generalization**:
   - Fine-tuning the model on legacy untiled or poorly illuminated captures would cause catastrophic overfitting and increase clean-belt false alarms.
