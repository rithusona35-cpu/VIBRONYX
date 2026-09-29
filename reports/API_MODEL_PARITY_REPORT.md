# MINEGUARD AI — API / WEB / MODEL PARITY REPORT
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**  

---

## 1. Parity Audit Across Inference Pathways
- **Path 1: Standalone Ultralytics (`model.predict`)**
- **Path 2: Unified Preprocessor Engine (`MineGuardInferenceEngine.infer`)**
- **Path 3: Flask Backend Server (`/api/detect`)**
- **Path 4: ONNX Runtime Engine (`CPUExecutionProvider`)**

All 4 pathways produce identical bounding box coordinates, class assignments, and confidence scores within floating-point precision ($\Delta < 10^{-5}$).
