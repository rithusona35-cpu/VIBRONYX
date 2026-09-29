# Final Demonstration Integration Report
**MineGuard AI — SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**
*Senior ML / Computer Vision / Embedded Systems Integration Team*
*Document Release: Final Production Integration Phase*

---

## 1. System Architecture
The end-to-end industrial defect inspection pipeline operates as follows:

```
Camera (Industrial USB3 / GigE / RTSP @ 1.2m standoff)
   ↓
Image Ingestion (Raw bytes / Frame Buffer)
   ↓
Image Decode & Validation (PIL / OpenCV with corrupt byte detection)
   ↓
EXIF Orientation Normalization (ImageOps.exif_transpose)
   ↓
Color Space Normalization (RGBA/Grayscale -> 3-Channel RGB)
   ↓
Stride-32 Letterbox Padding (800 × 800)
   ↓
YOLO11s Production Tensor Inference (models/final_sih_model.pt)
   ↓
Confidence Threshold Filtering (conf >= 0.25 default)
   ↓
Non-Maximum Suppression (NMS IoU = 0.50)
   ↓
Bounding Box Rescaling (Inverted padding directly to unscaled original pixels [0, W] x [0, H])
   ↓
Defect Classification & Severity Assignment (CRITICAL / WARNING / INFO / HEALTHY)
   ↓
Health State Contract Evaluation (DEFECT_DETECTED / NO_DETECTIONS / ANALYSIS_ERROR)
   ↓
Structured Telemetry Logger (logs/mineguard_telemetry.log)
   ↓
Hardware Controller Bridge (Machine-readable payload for STM32 / PLC)
   ↓
Flask REST API & WebSocket Telemetry (/api/detect, /api/control_signal, /api/demo_step)
   ↓
Web Visualizer Dashboard (Canvas bounding-box overlay & prominent emergency alarm)
   ↓
Physical Conveyor Emergency Relay (E-Stop Trigger / Motor Driver 24V cutoff)
```

---

## 2. Production Model Verification
- **Model Checkpoint**: `models/final_sih_model.pt`
- **Architecture**: YOLO11s (Ultralytics Small, 9,429,727 parameters)
- **Status**: **LOCKED & IMMUTABLE** (Zero retraining, fine-tuning, weight modifications, or quantization).

---

## 3. Cryptographic Model SHA256 Checksum

| Verification Checkpoint | Expected SHA256 | Measured SHA256 | Verification Result |
| :--- | :--- | :--- | :--- |
| **Pre-Integration** | `2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3` | `2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3` | **MATCH (0 Bytes Modified)** |
| **Post-Integration** | `2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3` | `2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3` | **MATCH (0 Bytes Modified)** |

---

## 4. Inference Configuration
- **Resolution**: $800 \times 800\text{ RGB}$
- **Confidence Threshold**: `0.25` (SIH Demo Sensitivity default)
- **NMS IoU Threshold**: `0.50`
- **Target Classes**:
  - `0 = Belt Splice` (Severity: **CRITICAL**)
  - `1 = Deep Scratch` (Severity: **WARNING / MAJOR**)
  - `2 = Longitudinal Tear` (Severity: **CRITICAL**)
  - `3 = Normal Belt` (Severity: **HEALTHY**)
  - `4 = Slight Scratch` (Severity: **INFO / MINOR**)

---

## 5. API Contract

### Primary Ingestion Endpoint: `POST /api/detect`
- **Input**: `multipart/form-data` with `file` (image binary) or `sample_filename`, optional `conf` float, optional `iou` float.
- **Output (200 OK - Defect Detected)**:
```json
{
  "model_name": "MineGuard YOLO11s",
  "model_version": "YOLO11s-Small-800px",
  "timestamp": "2026-09-19 22:27:51",
  "image_id": "IMG_1789837071995",
  "image_width": 800,
  "image_height": 800,
  "input_size": [800, 800],
  "confidence_threshold": 0.25,
  "detections": [
    {
      "class_id": 2,
      "class_name": "longitudinal tear",
      "display_name": "Longitudinal Tear",
      "confidence": 0.604,
      "bbox": [249, 66, 532, 238],
      "color": "#f43f5e",
      "severity": "CRITICAL",
      "recommended_action": "EMERGENCY: Shut down belt conveyor immediately to prevent complete split."
    }
  ],
  "total_detections": 1,
  "processing_time_ms": 178.4,
  "latency_ms": 178.4,
  "model_latency_ms": 148.4,
  "health_state": "DEFECT_DETECTED",
  "highest_severity": "CRITICAL",
  "hardware_control": {
    "health_state": "DEFECT_DETECTED",
    "defect_class": "LONGITUDINAL_TEAR",
    "confidence": 0.604,
    "severity": "CRITICAL",
    "action": "STOP_CONVEYOR"
  }
}
```

### Telemetry & Control Endpoints:
- `GET /api/control_signal`: Returns machine-readable hardware state for microcontrollers.
- `GET /api/hardware_status`: Returns peripheral connection status and camera optical parameters.
- `GET /api/demo_manifest`: Delivers the complete 6-step deterministic SIH demo manifest.
- `GET /api/demo_step/<int:step_id>`: Executes deterministic inference on specified demo frame (1 to 6).

---

## 6. Health-State Contract (Non-Hallucinatory)
The system enforces strict, non-hallucinatory state transitions:

1. **`DEFECT_DETECTED`**:
   - Condition: Model predicts 1 or more bounding boxes for classes 0, 1, 2, or 4 above the confidence threshold.
   - Action: `STOP_CONVEYOR` if any critical defect (Belt Splice / Longitudinal Tear) is present; otherwise `SCHEDULE_MAINTENANCE`.
2. **`NO_DETECTIONS`**:
   - Condition: Inference executes successfully, but zero bounding boxes meet the threshold.
   - Invariant: **NEVER automatically converted to `NORMAL_BELT`.**
   - Action: `CONTINUE`.
3. **`NORMAL_BELT`**:
   - Condition: Reported **ONLY** when the neural network explicitly detects class 3 (`Normal Belt`).
   - Action: `CONTINUE`.
4. **`ANALYSIS_ERROR`**:
   - Condition: File empty (0 bytes), decode fails, missing image, or tensor runtime error.
   - Invariant: **NEVER hidden or masked as healthy.**
   - Action: `SAFE_STATE`.

---

## 7. Web Dashboard Integration
- **Industrial Dashboard**: Operating on `http://127.0.0.1:5000`.
- **Key Metrics Immediately Visible**:
  - SYSTEM STATUS (Header Status Pill: Alert, Warning, Nominal)
  - CURRENT BELT CONDITION (Prominent visual card with health score penalty model)
  - DETECTED DEFECT (Live bounding boxes drawn directly on canvas)
  - CONFIDENCE (Per-defect label percentage display)
  - CAMERA FEED (Center viewport with live simulation mode)
  - HARDWARE CONTROL STATUS (STM32 Conveyor Control signal card)
- **Critical Defect Emergency Alert Banner**:
  - Displays prominent pulsing alert across screen:
    `CRITICAL DEFECT DETECTED: [DEFECT CLASS] (Confidence: XX%)`
    `CONVEYOR EMERGENCY STOP SIGNAL DISPATCHED TO STM32 CONTROLLER [ACTION: STOP_CONVEYOR]`
  - Strictly suppressed on `NO_DETECTIONS`, `NORMAL_BELT`, or `ANALYSIS_ERROR`.

---

## 8. Hardware Integration Interface
Software architecture bridge defined in `hardware_controller.py`:
- **Interface Protocol**: Serial UART (115200 baud) or JSON over HTTP/TCP.
- **Physical Hardware Verification Status**: **NOT VERIFIED** (Simulated software loopback verified; physical STM32 and motor driver not attached to local development workstation).
- **Control Signal Schema**:
  - `DEFECT_DETECTED (Critical)`: `action = "STOP_CONVEYOR"` (Relay tripped, motor driver 0V cut-off).
  - `DEFECT_DETECTED (Non-Critical)`: `action = "SCHEDULE_MAINTENANCE"` (Relay open, motor active, maintenance ticket logged).
  - `NO_DETECTIONS`: `action = "CONTINUE"` (Relay open, motor running at nominal PWM).
  - `ANALYSIS_ERROR`: `action = "SAFE_STATE"` (Standby mode, warning audio beacon).

---

## 9. Deterministic 6-Step Demonstration Sequence
Audited and stored in `demo/demo_manifest.json`:

| Step | Title | Defect Class | Image Reference | Model Predictions | Health State | Hardware Action |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **1** | Clean Conveyor Belt | None | `frame_00021_jpg.rf...jpg` | 0 boxes | `NO_DETECTIONS` | `CONTINUE` |
| **2** | Belt Splice Joint | Belt Splice | `belt_splice_1_frame_00002...jpg` | Splice (0.693), Tear (0.526) | `DEFECT_DETECTED` | `STOP_CONVEYOR` |
| **3** | Deep Scratch & Gouge | Deep Scratch | `deep_scratch_1_frame_00024...jpg` | Scratch (0.674), Tear (0.521) | `DEFECT_DETECTED` | `STOP_CONVEYOR` |
| **4** | Longitudinal Tear | Longitudinal Tear | `longitudinal_tear_2_frame_00007...jpg` | Tear (0.604) | `DEFECT_DETECTED` | `STOP_CONVEYOR` |
| **5** | Slight Scratch | Slight Scratch | `slight_scratch_5_frame_00129...jpg` | Slight Scratch (0.394) | `DEFECT_DETECTED` | `SCHEDULE_MAINTENANCE` |
| **6** | Clean Belt Return | None | `frame_00021_jpg.rf...jpg` | 0 boxes | `NO_DETECTIONS` | `CONTINUE` |

---

## 10. Test Execution Results
All automated unit and integration tests executed cleanly:

```
=======================================================
AUTOMATED TEST SUITE SUMMARY
=======================================================
1. tests/test_model_contract.py         : 10 / 10 PASS
2. tests/test_threshold_behavior.py     :  3 /  3 PASS
3. tests/test_no_detection_state.py     :  3 /  3 PASS
4. tests/test_bbox_scaling.py           :  2 /  2 PASS
5. tests/test_class_mapping.py          :  3 /  3 PASS
6. tests/test_final_integration.py      : 10 / 10 PASS
7. test_pipeline.py (15-Point Suite)    : 15 / 15 PASS
=======================================================
TOTAL AUTOMATED TESTS EXECUTED: 46
TOTAL TESTS PASSED:             46 (100.0%)
REGRESSIONS DETECTED:           0
=======================================================
```

---

## 11. Latency Measurements (Measured on Host CPU)
- **Batch Size**: 1
- **Resolution**: $800 \times 800$
- **Model Tensor Latency**: **148.4 ms – 197.5 ms**
- **End-to-End Latency (Decode + Preprocess + Infer + NMS + Rescale + Base64)**: **174.1 ms – 214.7 ms**
- **ONNX Runtime Latency**: **138.3 ms**
- *Note*: Physical Jetson Orin Nano hardware benchmark is **NOT VERIFIED** on this workstation.

---

## 12. Known Real-World Limitations
1. **Annotation Sizing Discrepancy**: Human real-world annotations frequently span entire belt widths ($>40\%$ image area), producing low strict IoU ($<0.45$) despite accurate defect-center localization.
2. **Camera Standoff Degradation**: At distances $>1.5\text{ m}$, fine hairline scratches ($<2\text{ mm}$) drop below $1\text{ pixel}$ on $800\times 800$ representation, causing optical demosaicing loss.
3. **Overhead Specular Glare**: Unfiltered direct factory overhead lamps create specular glare streaks that can produce slight scratch false alarms on clean rubber unless cross-polarization extinction is deployed.

---

## 13. Physical Setup Requirements for SIH Demonstration Rig
- **Working Standoff Distance**: **$1.20\text{ meters} \pm 0.05\text{ m}$** normal to belt surface.
- **Optics**: $12.5\text{ mm}$ C-mount low-distortion lens.
- **Illumination**: Dual-sided linear LED bars angled at **$18^\circ$ low-angle grazing incidence** to cast relief shadows into scratches and tears.
- **Polarization**: Linear polarizing sheets on LEDs cross-oriented at $90^\circ$ relative to the camera lens filter.
- **Camera Settings**: Fixed manual focus, fixed exposure ($1/1500\text{ s}$), fixed white balance, auto-processing disabled.

---

## 14. SIH Demonstration Procedure
1. **Start Backend Server**:
   ```bash
   python app_backend_server.py
   ```
2. **Open Dashboard**:
   Navigate to `http://127.0.0.1:5000` in Google Chrome or Microsoft Edge.
3. **Execute Deterministic Demo Flow**:
   - In the left **Inspection Control** panel, click **SIH Demo** tab.
   - Click **Auto Run (6s)** or step through **Steps 1 to 6** sequentially:
     - **Step 1**: Clean belt loads -> Status: `NO DEFECT DETECTED ABOVE THRESHOLD` -> Hardware Signal: `CONTINUE`.
     - **Step 2**: Belt Splice loads -> Status: `ALERT: CRITICAL DEFECT DETECTED` -> Prominent Red Alert Banner pops up -> Hardware Signal: `STOP_CONVEYOR`.
     - **Step 3**: Deep Scratch loads -> Status: `ALERT: CRITICAL DEFECT DETECTED` -> Warning / Emergency stop triggered.
     - **Step 4**: Longitudinal Tear loads -> Status: `ALERT: CRITICAL DEFECT DETECTED` -> Red Alert Banner pops up -> Hardware Signal: `STOP_CONVEYOR`.
     - **Step 5**: Slight Scratch loads -> Status: `WARNING: DEFECT DETECTED` -> Yellow banner -> Hardware Signal: `SCHEDULE_MAINTENANCE`.
     - **Step 6**: Return to clean belt -> Status resets to `NO DEFECTS DETECTED` -> Red banner strictly disappears -> Hardware Signal: `CONTINUE`.
4. **Verify Telemetry**:
   Check `logs/mineguard_telemetry.log` for bit-exact JSON audit logs.
