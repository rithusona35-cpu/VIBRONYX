# MINEGUARD AI — BELT HEALTH INDEX DETERMINISTIC FORMULATION (PHASE 12)
**SIH Problem Statement:** SIH 26008 — Conveyor Belt Defect Detection  
**Topic:** Forensic Source Analysis & Mathematical Formulation of Belt Health Index  
**Date:** September 14, 2026  

---

## 1. Forensic Investigation of the Legacy "94.2%" Value

### The Investigation:
In the initial prototype screenshot, the dashboard presented:
$$\text{Belt Health Index: } 94.2\%$$
A forensic search across the repository discovered:
* `D:\SIH\anband told\templates\index.html:63`:
  ```html
  <div class="metric-card">
      <div class="metric-icon emerald"><i class="fa-solid fa-heart-pulse"></i></div>
      <div class="metric-info">
          <span class="metric-label">Belt Health Index</span>
          <h3 id="statHealthIndex">94.2%</h3>
      </div>
  </div>
  ```
* In `main.js`: There was **zero JavaScript code** that ever referenced or updated `statHealthIndex`.
* **Conclusion**: `94.2%` was a **completely static, hardcoded HTML placeholder** created for early UI prototyping. It was never connected to the inference engine.

---

## 2. The Deterministic Belt Health Index Formulation

To ensure industrial integrity and prevent fabricated safety claims, the static placeholder has been replaced with an automated **deterministic structural penalty model** calculated directly from cumulative session inspection detections.

### Mathematical Formulation:

$$\text{Health Index} = \max\left(10.0\%,\ \min\left(100.0\%,\ 100.0\% - P_{\text{critical}} - P_{\text{warning}} - P_{\text{minor}}\right)\right)$$

Where the penalty terms are defined by industrial severity:
1. **Critical Defect Penalty ($P_{\text{critical}}$)**:
   For every detected **Belt Splice (Class 0)** or **Longitudinal Tear (Class 2)**:
   $$P_{\text{critical}} = N_{\text{critical}} \times 8.0\%$$
   *(Reflects immediate risk of catastrophic joint rupture or belt separation).*

2. **Warning Defect Penalty ($P_{\text{warning}}$)**:
   For every detected **Deep Scratch (Class 1)**:
   $$P_{\text{warning}} = N_{\text{warning}} \times 2.5\%$$
   *(Reflects structural gouges that compromise carcass longevity).*

3. **Minor Defect Penalty ($P_{\text{minor}}$)**:
   For every detected **Slight Scratch (Class 4)**:
   $$P_{\text{minor}} = N_{\text{minor}} \times 0.5\%$$
   *(Reflects surface abrasion without imminent failure risk).*

4. **Nominal Floor**:
   The index is bounded below by $10.0\%$ to indicate an operable conveyor in severe degradation status requiring immediate shutdown.

---

## 3. Dynamic Visual Styling in UI

The health index element dynamically adjusts its styling according to safety thresholds:
* **$\ge 80.0\%$ (Green `#10b981`)**: Nominal Operational Status.
* **$50.0\% - 79.9\%$ (Amber `#f59e0b`)**: Warning Status. Maintenance window inspection required.
* **$< 50.0\%$ (Red `#ef4444`)**: Critical Alert Status. Conveyor emergency stop recommended.

---

## 4. UI Labeling Transparency

In `templates/index.html`, the metric card is now explicitly labeled:
```html
<span class="metric-label">Belt Health Index (Live)</span>
<h3 id="statHealthIndex">100.0%</h3>
<span style="font-size: 0.72rem; color: #64748b;">Deterministic Penalty Model</span>
```
This guarantees that operators and SIH evaluators are never misled by static or synthetic telemetry.
