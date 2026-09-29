# MINEGUARD AI — NON-HALLUCINATORY STATE MACHINE AUDIT REPORT
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**  

---

## 1. Fix: Separation of Current Frame State vs Safety Latch State
- **Prior Flaw:** When the conveyor was latched in emergency stop (`CRITICAL_STOP_LATCHED`), scanning a subsequent clean belt frame caused `DEFECT_DETECTED` and `CRITICAL_STOP_LATCHED` to be returned as the detection, confusing the user into thinking a defect was detected on clean rubber.
- **Enforced Rule 25:**
  - `CURRENT_FRAME_STATE`: Strictly evaluates the optical frame (`NO_DETECTIONS`).
  - `SAFETY_LATCH_STATE`: Represents physical contactor lock (`CRITICAL_STOP_LATCHED`).
  - `ACTION`: Strictly maintains `STOP_CONVEYOR` until operator reset.
  - Telemetry clearly reports both dimensions without hallucination.
