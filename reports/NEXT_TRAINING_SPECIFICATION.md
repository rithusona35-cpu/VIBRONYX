# Specification for Future ML Training Phase (Post-Optical Calibration)
**MineGuard AI — SIH 26008: Targeted Retraining Protocol**

---

## 1. Data Collection & Distribution Requirements
- **Total New Images**: Minimum 1,100 unique industrial conveyor frames.
- **Per-Class Targets**:
  - Belt Splice: 200 scenes (vulcanized joints, mechanical clips, step splices).
  - Longitudinal Tear: 250 scenes (punctures, hairline splits, full carcass cuts).
  - Deep Scratch: 250 scenes (grooves $>2\text{ mm}$, rock drag gouges).
  - Slight Scratch: 250 scenes (fine abrasive scuffs under low-angle cross-light).
  - Clean Conveyor Belt (Hard Negatives): 300 scenes (clean rubber under dust, water, glare, roller edges).

---

## 2. Optical Standardization
- **Camera Standoff**: Strictly $1.20\text{ m} \pm 0.05\text{ m}$.
- **Illumination**: Dual $18^\circ$ grazing incidence linear LED bars with cross-polarizing filters at $90^\circ$ extinction.
- **Camera Configuration**: Fixed manual shutter ($1/1500\text{ s}$), fixed focus, fixed ISO 100, zero auto-processing.

---

## 3. Strict Annotation Policy
- **Tiling**: Continuous longitudinal tears and scratches MUST be partitioned into $200\text{ px}$ contiguous segment boxes.
- **Tightness**: Bounding boxes must enclose only the visible damage boundary ($\le 10\%$ healthy rubber margin).

---

## 4. Training Hyperparameters
- **Architecture**: YOLO11s (9.4M parameters).
- **Resolution**: $800\times 800$.
- **Batch Size**: 16 (or 32 with GPU gradient accumulation).
- **Epochs**: 100 with Early Stopping patience = 20.
- **Data Isolation**: 100% Sequence Isolation. Real-world holdout datasets MUST NEVER enter training.
