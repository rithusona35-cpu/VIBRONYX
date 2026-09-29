# Web & API Model Parity Verification Report
**SIH 26008: Production Integration Parity**

---

## 1. Parity Across Variable Camera Resolutions

| Resolution | Width × Height | Detections Count | Health State Output | Total API Latency | Coordinate Bounds Validity |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `800x800` | 800x800 | **1** | `DEFECT_DETECTED` | 409.1 ms | **PASS** |
| `1920x1080` | 1920x1080 | **1** | `DEFECT_DETECTED` | 280.2 ms | **PASS** |
| `1280x720` | 1280x720 | **1** | `DEFECT_DETECTED` | 228.6 ms | **PASS** |
| `640x480` | 640x480 | **1** | `DEFECT_DETECTED` | 311.3 ms | **PASS** |

---

## 2. Parity Invariants Verified
1. **Numerical Parity**: Direct YOLO outputs and Backend JSON payloads match with $0.000$ coordinate divergence.
2. **Health State Parity**: Zero detections strictly yield `NO_DETECTIONS`; defect detections yield `DEFECT_DETECTED`.
3. **Bounding Box Scaling**: All coordinates rescale accurately to original image dimensions regardless of upload resolution.
