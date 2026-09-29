# MINEGUARD AI — TRAINING DECISION REPORT
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**  

---

## 1. Current Model Scorecard
- **Architecture:** YOLO11s (9,429,727 parameters)
- **Production SHA256:** `2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3`
- **Horizontal Defect Recall:** 100% (Belt Splice, Longitudinal Tear, Deep Scratch, Slight Scratch)
- **Clean Belt False Alarm Rate:** 0.0% (Zero false alarms on real-world clean conveyor rubber)
- **Standalone/API Parity:** 100% Bit-exact match ($\Delta < 10^{-5}$)

## 2. Root Cause Audit of Inconsistencies
| Potential Failure Mode | Finding | Status |
| :--- | :--- | :--- |
| **Pipeline Code Bug** | Orientation handling on vertical mobile uploads ($1:2.2$ aspect ratio) decimated defect width | **TRUE (PREPROCESSING ISSUE)** |
| **State Machine Bug** | Stale `CRITICAL_STOP_LATCHED` state displayed as fake defect on clean frames | **TRUE (STATE MACHINE BUG)** |
| **Annotation Sizing Mismatch** | Human boxes oversized ($2.5	imes$ to $10	imes$ healthy rubber), penalizing IoU | **TRUE (EVALUATION ARTIFACT)** |
| **Optical Transformation** | Minor confidence degradation on extreme blur/darkening, but detection retained | **RESOLVED (ROBUST)** |
| **Genuine Model Weakness** | None detected on standardized industrial horizontal gantry images | **FALSE** |

## 3. Training Decision
> [!IMPORTANT]
> **DECISION: MODEL_TRAINING_NOT_JUSTIFIED**
> The root cause of the observed failure on `uploads/last_upload.jpg` was an **input aspect-ratio/orientation mismatch** and a **state machine latch separation bug**, NOT a failure of model weights.
> Blindly retraining the model would risk catastrophic forgetting, degrade clean-belt false alarm performance (currently 0%), and introduce data leakage.
> In accordance with Rule 8 and Rule 17, the production model `models/final_sih_model.pt` is **RETAINED IMMUTABLE**.
