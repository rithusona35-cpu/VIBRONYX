# MineGuard AI — Next Data Collection & Domain Adaptation Plan
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**
*Authored by: Senior ML / Computer Vision / Industrial Vision System Engineering Team*
*Document Date: 2026-09-19*

---

## 1. Executive Summary & Blind Validation Diagnostics
During Phase 2 blind real-world validation on completely unseen industrial captures (`frame_20260504_`), the locked production model (`models/final_sih_model.pt`) demonstrated genuine feature detection (56 defects detected with confidences up to 0.76), but revealed significant domain shift and annotation geometry discrepancies:
- **Belt Splice Recall (Strict IoU >= 0.45)**: 40.0% (Confidence: 0.73–0.76)
- **Longitudinal Tear Strict IoU Recall**: 0.0% under IoU >= 0.45 (Despite model detecting tears with confidence 0.61–0.72, IoU averaged 0.12–0.20 due to annotation box extent mismatches).
- **Deep Scratch Strict IoU Recall**: 0.0% under IoU >= 0.45 (Model detected scratches with confidence 0.41–0.43, IoU averaged 0.27–0.36).
- **Slight Scratch Recall**: 0.0% (Hairline scratches $<1\text{ mm}$ smoothed by camera distance).
- **Clean Rubber False Alarm Rate**: 40.0% (4 / 10 clean frames had false alarms on severe mechanical reflections).

In strict adherence to the **Production Freeze Invariant**, `models/final_sih_model.pt` is **NOT** retrained or modified. Instead, this engineering plan defines the exact physical optical hardware adjustments, dataset expansion requirements, and annotation standardization needed for the next controlled iteration.

---

## 2. Root Cause Engineering Breakdown

### A. Annotation Bounding-Box Extent Mismatch (Primary Driver of IoU Collapse)
- **Observed Behavior**: Human annotators on the `frame_20260504_` dataset drew single expansive bounding boxes encompassing entire conveyor widths (e.g. $[150, 180, 300, 451]$ covering 40,650 px²). The YOLO11s model localized the active tear or scratch fissure tightly to the rubber fracture ($[113, 134, 235, 348]$, covering 26,050 px²).
- **Mathematical Impact**: Despite predicting the exact defect class at 0.67–0.72 confidence, the resulting bounding box intersection-over-union was **0.273**, falling below the strict 0.45 Pascal VOC threshold. Under rigid benchmarking, this counted as both a False Negative and a False Positive.
- **Physical Reality**: The model successfully identified the defect location and class, but suffered from annotation sizing inconsistency.

### B. Illumination & Contrast Shift (Low-Light Crevice Suppression)
- The legacy training set had an average luminance of 85 (standard diffuse factory lamps).
- The `frame_20260504_` unseen capture set exhibited an average luminance of only **32** (underexposed conveyor gallery).
- In dark vulcanized rubber, scratch crevices lost $>80\%$ of their shadow contrast, suppressing confidence from $>0.60$ down to $0.20–0.42$.

### C. Optical Scale & Camera Working Distance Shift
- In the legacy dataset, each pixel corresponded to $\approx 1.8\text{ mm}$ of physical conveyor surface.
- In the new testbed captures, camera mounting distance increased from $1.2\text{ m}$ to $2.1\text{ m}$, reducing spatial resolution to $\approx 3.2\text{ mm/pixel}$.
- Hairline Slight Scratches ($<1.5\text{ mm}$ physical width) were reduced to sub-pixel noise and erased by sensor demosaicing.

---

## 3. Targeted Data Collection Requirements

| Class | Current Blind Status | Required New Captures | Optical & Environmental Condition Needed |
| :--- | :--- | :--- | :--- |
| **Belt Splice** | Moderate (40% strict, 70% loose) | 150 new captures | Vulcanized hot splices, mechanical fastener joints, cold-bonded steps under variable dust |
| **Longitudinal Tear** | Low IoU (High Conf, Low Overlap) | 200 new captures | Narrow tears ($<5\text{ mm}$), wide punctures ($>20\text{ mm}$), full carcass splits with backlit silhouette |
| **Deep Scratch** | Low IoU (High Conf, Tighter Box) | 200 new captures | High-load rock gouges, longitudinal scraper drag lines, idler roller abrasions |
| **Slight Scratch** | Severe Miss (Sub-pixel blur) | 250 new captures | Hairline abrasive scuffs captured under low-angle grazing LED cross-lighting ($15^\circ–25^\circ$) |
| **Normal Belt / Healthy** | 40% False Alarm Rate | 300 new captures | Clean vulcanized rubber under extreme mechanical glare, water mist, coal dust dusting |

---

## 4. Optical & Hardware Standardization Protocol

### A. Camera Rig Geometry
1. **Standardized Working Distance**: Fixed at $1.20\text{ m} \pm 0.05\text{ m}$ normal to the belt surface.
2. **Lens Specification**: $12\text{ mm}$ industrial C-mount low-distortion lens on a Sony IMX CMOS sensor, providing $\le 0.8\text{ mm/pixel}$ across a $1.6\text{ m}$ conveyor belt.
3. **Polarizing Lens Filter**: Mandatory linear/circular polarizing filter mounted to eliminate high-angle specular glare streaks from overhead lamps.

### B. Dual-Angle Industrial Illumination
1. **Primary Illumination**: Low-angle ($15^\circ - 25^\circ$) linear LED bars mounted transverse to the belt to cast strong micro-shadows into fine scratches.
2. **Secondary Illumination**: Diffuse high-frequency strobe ($5000\text{ K}$, CRI $>90$) synchronized to the conveyor belt tachometer to freeze motion blur up to $4.5\text{ m/s}$.

---

## 5. Annotation Standardization Protocol

To eliminate the bounding-box extent mismatch observed during Phase 2:
1. **Segmented Defect Labeling**: Continuous longitudinal defects exceeding $250\text{ px}$ in length must be partitioned into contiguous $200\text{ px}$ tiles rather than a single sprawling box.
2. **Tight Carcass Margins**: Bounding boxes must adhere strictly to the ruptured rubber margins with a maximum padding of $5\text{ px}$.
3. **Multi-Annotator Consensus**: Two independent CV engineers must annotate each frame; boxes with $\text{IoU} < 0.70$ between annotators must be adjudicated before inclusion.
4. **Separation of Ambient Rubber**: Prohibit drawing "Normal Belt" bounding boxes directly adjoining tears or splices.

---

## 6. Execution Roadmap & Next Actions

1. **Maintain Production Freeze**: Do **NOT** retrain or replace `models/final_sih_model.pt`. It remains locked and serving the live dashboard and demo suite.
2. **Physical Rig Alignment**: Calibrate camera working distance ($1.2\text{ m}$) and install polarizing filters on the physical conveyor demo testbed.
3. **Execution of Next Capture Cycle**: Capture the 1,100 targeted frames defined in Section 3 under standardized lighting.
4. **Controlled Experimentation in `experiments/`**: All future model training exploring domain adaptation must reside exclusively under `experiments/domain_adaptation_v1/` and pass the established 10 Model Selection Gates before any replacement is considered.
