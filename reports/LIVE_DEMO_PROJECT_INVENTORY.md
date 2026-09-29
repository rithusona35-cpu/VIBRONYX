# MINEGUARD AI — LIVE DEMONSTRATION & INFERENCE PIPELINE PROJECT INVENTORY
**Project**: SIH 26008 — AI-Based Industrial Conveyor Belt Defect Detection and Monitoring System  
**Evaluation Scope**: Final Live Laptop Demonstration Hardening, PyTorch CPU Profiling & Hardware Control Audit  
**Date**: September 21, 2026

---

## 1. System Inventory & File Matrix

| Component | Primary File | Key Classes / Functions | Status & Purpose |
| :--- | :--- | :--- | :--- |
| **Model Weight (Production)** | `models/final_sih_model.pt` | YOLO11s (800×800) | **LOCKED & IMMUTABLE** (SHA256: `2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3`) |
| **Web Backend / API Server** | `app_backend_server.py` | Flask App, `/api/detect`, `/api/model_info`, `/api/control_signal`, `/api/hardware_status`, `/api/operator_reset`, `/api/demo_manifest`, `/api/demo_step/<id>` | Production Web & API Gateway (Port 5000) |
| **Unified Preprocessor** | `unified_preprocessor.py` | `MineGuardInferenceEngine`, `decode_image()`, `infer()`, `letterbox()`, `exif_transpose()` | Centralized image normalization, EXIF orientation correction, letterbox padding, model caching |
| **Smart Orientation Router** | `orientation_aware_fusion.py` | `SmartOrientationRouter`, `detect_orientation_views()`, `fuse_orientation_detections()`, `transform_bbox_to_original()` | Dual-path inference: Fast Path (0° landscape) vs Fallback Path (90°/270° portrait recovery) |
| **Hardware Controller** | `hardware_controller.py` | `ConveyorHardwareController`, `HardwareState`, `STM32ProtocolAbstraction`, `operator_reset()`, `process_detection_result()` | State machine, Emergency stop latching, Operator reset, Verified SIMULATION mode |
| **Frontend UI View** | `templates/index.html` | Dashboard HTML, Canvas View, Telemetry Grids, SIH 6-step demo bar, Audit logs | Industrial Dark-Glass UI with real-time HUD |
| **Frontend Logic** | `static/js/main.js` | `runDetection()`, `renderCanvas()`, `updateUI()`, `executeOperatorReset()`, `executeDemoStepInUI()`, `toggleLiveStream()` | Client-side bounding box overlay, API polling, telemetry sync, safety latch HUD |
| **Styling & Theme** | `static/css/style.css` | Industrial Glassmorphism CSS | Design system tokens, alert pulses, latency badges |
| **Demo Controller** | `demo/sih_demo_controller.py` | `run_step(1..6)`, `run_all()`, `run_live_camera()` | Programmatic CLI demo controller for SIH presentations |
| **Demo Manifest** | `demo/sih_final_demo_manifest.json` | 6-step deterministic demonstration scenarios | Manifest with images, classes, confidences, latencies |
| **Launchers** | `run_sih_demo.bat`, `run_sih_demo.ps1` | Environment activation, SHA256 integrity check, backend launch, browser startup | Safe one-command startup |

---

## 2. Model & Inference Architecture

- **Architecture**: Ultralytics YOLO11s (Single Shot Object Detector)
- **Input Geometry**: 800 × 800 × 3 (RGB), 32-stride letterbox padded with color `(114, 114, 114)`.
- **Inference Mode**: PyTorch CPU (`torch.no_grad()`, `device='cpu'`).
- **Default Hyperparameters**: Confidence threshold `conf = 0.25`, NMS IoU threshold `iou = 0.45` / `0.50`.
- **Target Classes (5 Classes)**:
  - `0`: Belt Splice (`CRITICAL`, Red)
  - `1`: Deep Scratch (`WARNING`, Amber)
  - `2`: Longitudinal Tear (`CRITICAL`, Rose)
  - `3`: Normal Belt (`HEALTHY`, Emerald)
  - `4`: Slight Scratch (`INFO`, Cyan)

---

## 3. Preprocessing, EXIF & Orientation Subsystems

1. **Decoding**:
   - `Image.open(io.BytesIO(file_bytes))` with `ImageOps.exif_transpose()` to prevent mobile device rotation artifacts.
   - Converted to RGB NumPy array or BGR for OpenCV.
2. **Aspect Ratio Analysis**:
   - Aspect ratio $R = \text{width} / \text{height}$.
   - If $R < 0.85$ (Portrait) or baseline returns 0 detections on damaged belt, `SmartOrientationRouter` triggers Fallback Path.
3. **Multi-View Inference & Fusion**:
   - Primary fallback evaluations: 270° clockwise (canonical industrial belt direction) and 90° clockwise.
   - Bounding boxes mapped back via affine coordinate inversion `transform_bbox_to_original()`.
   - Redundant / duplicate boxes suppressed via IoU suppression.

---

## 4. Hardware Simulation & Safety State Machine

- **Operating Mode**: `MINEGUARD_HARDWARE_MODE="SIMULATION"` (Physical relays de-energized, zero 24V risk during laptop presentation).
- **Communication Protocol**: `STM32ProtocolAbstraction` (UART 115200 8N1 JSON frame with CRC8 checksum).
- **Safety Invariant**:
  - `STOP_CONVEYOR` trips `critical_stop_latched = True`.
  - Subsequent clean frames yield `CURRENT_FRAME_STATE = NO_DETECTIONS`, but `SAFETY_LATCH_STATE = STOP_LATCHED`.
  - Machine auto-restart is physically prevented until explicit authenticated `operator_reset()` is invoked.

---

## 5. Existing Test Suites & Benchmarks

- `tests/test_pipeline.py` (End-to-end vision & hardware pipeline)
- `tests/test_known_defect_pipeline.py` (Specific defect verification)
- `tests/test_confidence_sweep.py` (Threshold stability)
- Unit test suite: 54 tests across `tests/` directory (100% PASS).
- Reports directory:
  - `reports/final_demo/`
  - `reports/FINAL_SIH_SYSTEM_INVENTORY.md`
  - `reports/final_demo/SAFETY_TEST_MATRIX.csv`
  - `reports/final_demo/hardware_signal_log.json`
  - `reports/final_demo/visual/` (10 evidence images)
