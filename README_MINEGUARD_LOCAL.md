# MineGuard AI — Local Website & Industrial Conveyor Safety System
## SIH Problem Statement 26008: Conveyor Belt Defect Detection, Telemetry & Safety Interlock

---

## 1. Project Architecture

MineGuard AI integrates physical sensor fusion, frozen edge AI defect classification, an authoritative deterministic safety state machine, STM32 microcontroller interlock hardware, and real-time cloud data logging with Supabase into an industrial SCADA-style web monitoring platform.

```
       +---------------------------------------------+
       |             CONVEYOR BELT LINE              |
       +---------------------------------------------+
             |                                |
   [Optical Camera]                  [Sensor Suite]
             |                   (MPU6050, ACS712, Rotary
             v                    Encoder, DS18B20, TCRT5000)
       CameraManager                          |
      (Latest-Frame)                          v
             |                        STM32 Controller
             v                      (115200 Baud, CRC-8)
   SmartOrientationRouter                     |
   (0° / 90° / 270° Fusion)                   |
             |                                |
             v                                |
  YOLO11s Frozen Model                        |
    (800x800 Tensor)                          |
             |                                |
             v                                v
       Defect Classifier            Hardware Controller
             |                      (Deterministic FSM)
             +------------------------------->|
                                              | (Actuator Signal)
                                              v
                                      CONVEYOR MOTOR
                                  (Run / Stop / Latched)
                                              |
                     +------------------------+-----------------------+
                     |                                                |
                     v                                                v
             Supabase Cloud DB                               Local Web Dashboard
         (Realtime / PostgreSQL)                            (SCADA Master Panel)
```

---

## 2. Directory Structure

```
MineGuard_AI_Conveyor_System/
├── app.py                      # Authoritative Unified Flask Application Server
├── app_backend_server.py       # Compatibility backend alias
├── code.html                   # Industrial Master SCADA Control Dashboard
├── config.js                   # Supabase client configuration (URL & anonKey)
├── dashboard.js                # Frontend telemetry and vision bridge controller
├── hardware_integration.js     # SCADA status cards, charts, demo controls & FSM
├── unified_preprocessor.py     # 800x800 preprocessing, letterboxing, class mapper
├── orientation_aware_fusion.py # SmartOrientationRouter (Fast & Fallback paths)
├── hardware_controller.py      # Deterministic 9-State Safety FSM & STM32 UART protocol
├── camera_manager.py           # Threaded OpenCV capture (Latest-Frame-Wins)
├── models/
│   ├── final_sih_model.pt      # FROZEN Production Checkpoint (SHA256 locked)
│   ├── final_sih_model.onnx    # High-speed ONNX runtime checkpoint
│   └── final_sih_model_metadata.json # 5-Class metadata mapping & thresholds
├── demo/
│   ├── sih_final_demo_manifest.json # 10-step SIH golden demonstration manifest
│   ├── sih_demo_controller.py  # Standalone CLI demo runner
│   └── final_demo_images/      # Ground truth demo test images
├── tests/                      # 73 Modular Regression Unit Tests
├── run_all_unit_tests.py       # 73-Test test runner
├── test_web_integration.py     # 15 Full-Stack Web Integration Tests
├── schema.sql                  # Primary Supabase schema
├── integration_schema.sql      # Non-destructive safety & command extension schema
└── run.bat                     # 1-Click local launcher
```

---

## 3. Installation & Dependencies

MineGuard AI runs locally on Windows using standard Python 3.8+:

```bash
pip install flask flask-cors pillow numpy opencv-python torch ultralytics pyserial
```

---

## 4. Environment Variables

Create or update `.env` in the working directory (optional — sensible defaults are built in):

```ini
# Supabase Cloud Integration (Preserved)
SUPABASE_URL=https://tffhdzctkfdmzamwqxal.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmZmhkemN0a2ZkbXphbXdxeGFsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2MTM4MTEsImV4cCI6MjEwNDE4OTgxMX0.rDc7I_VHd4Egypi311fXVvsvrpRqbgbYinOV32irioo

# Physical Hardware Switch
# Keep 0 for safe demonstration mode (simulation fallback)
MINEGUARD_PHYSICAL_HARDWARE_VERIFIED=0
STM32_COM_PORT=COM3
STM32_BAUD=115200

# Operator Authorization
MINEGUARD_OPERATOR_TOKEN=MINEGUARD_RESET_2026
```

---

## 5. Quick Local Startup

### Option 1: 1-Click Batch Launcher
Double-click `run.bat` or `start_mineguard.bat`.
It checks dependencies, boots the unified Flask server on `http://127.0.0.1:5000/`, and opens your default browser.

### Option 2: Command Line
```cmd
cd "C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System"
python app.py
```
Open your browser at:
**`http://127.0.0.1:5000/`**

---

## 6. Frozen Production AI Model

- **Model File**: `models/final_sih_model.pt`
- **Architecture**: YOLO11s (9,429,727 parameters, Small checkpoint)
- **Input Resolution**: 800 × 800 pixels
- **Status**: PERMANENTLY LOCKED & FROZEN
- **SHA-256 Checksum**:
  `2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3`

### 5-Class Defect Definitions
| Class ID | Defect Name | Severity | Actuator Interlock Action |
|---|---|---|---|
| `0` | **Belt Splice** | CRITICAL | STOP_CONVEYOR & STOP_LATCHED |
| `1` | **Deep Scratch** | WARNING | ALERT / MAINTENANCE (Conveyor Continues) |
| `2` | **Longitudinal Tear** | CRITICAL | STOP_CONVEYOR & STOP_LATCHED |
| `3` | **Normal Belt** | NORMAL | CONTINUE (Healthy) |
| `4` | **Slight Scratch** | WARNING | ALERT (Conveyor Continues) |

---

## 7. Safety State Machine & Latch Invariant

The deterministic 9-State Finite State Machine enforces:
`SYSTEM_READY` &rarr; `BELT_RUNNING` &rarr; `DEFECT_DETECTED` &rarr; `SEVERITY_ANALYSIS` &rarr; `STOP_CONVEYOR` &rarr; `STOP_LATCHED` &rarr; `AUTHORIZED_RESET` &rarr; `SYSTEM_READY`

### Critical Safety Invariants
1. **Critical Stop Latching**: Detecting a `Belt Splice` or `Longitudinal Tear` trips `STOP_CONVEYOR` and engages `STOP_LATCHED`.
2. **Strict No-Auto-Restart Rule**: Ingesting a subsequent clean camera frame while latched **DOES NOT restart the conveyor**. The system remains locked in `STOP_LATCHED`.
3. **Authorized Reset Required**: Clearing the latch requires an explicit operator reset with a verified token (`MINEGUARD_RESET_2026`).

---

## 8. STM32 Hardware & Simulation Fallback

- **Target MCU**: STM32F401RE Nucleo-64 or STM32F411CE Black Pill
- **Baud Rate**: 115200 baud, 8N1
- **Binary Frame**:
  `[0xAA][0x55][SEQ][MSG_TYPE][LEN][PAYLOAD][CRC8][0x0D][0x0A]`
  - CRC-8 Polynomial: `0x07`
  - Commands: `0x01` CMD_RUN, `0x02` CMD_STOP, `0x03` CMD_ESTOP, `0x04` CMD_RESET, `0xFF` HEARTBEAT_PING
  - Telemetry: `0x10` TELEMETRY_PACKET
- **Simulation Fallback**: If no physical STM32 COM port is detected, the system automatically runs in high-fidelity `SIMULATION` mode without crashing or throwing unhandled errors.

---

## 9. Live Camera Monitoring

- Threaded capture using OpenCV DirectShow backend (`camera_manager.py`).
- **Latest-Frame-Wins Policy**: Inference always analyzes the most recent frame, preventing processing queue lag.
- **SmartOrientationRouter**:
  - Landscape conveyor view &rarr; Fast Path (0° single pass, ~140 ms).
  - Portrait / anomalous orientation &rarr; Fallback Multi-View Path (0°, 90°, 270°) with inverse affine coordinate projection.
  - UI displays `"ORIENTATION RECOVERED (90° Rotation Detected)"` when recovered.
- If physical webcam is offline, UI gracefully indicates `CAMERA OFFLINE` with standby test pattern.

---

## 10. Verification & Test Suite

Run the full automated verification test suite:

### 1. 73 Modular Regression Unit Tests:
```cmd
python run_all_unit_tests.py
```
*Result*: **73/73 PASS (0 errors, 0 failures)**

### 2. 15 Full-Stack Web Integration Tests:
```cmd
python test_web_integration.py
```
*Result*: **15/15 PASS (0 errors, 0 failures)**

**Total Automated Test Coverage**: **88/88 Automated Tests Passing**.

---

## 11. SIH Demo Procedure (10-Step Walkthrough)

Open `http://127.0.0.1:5000/` and navigate to the **SIH 26008 Demonstration Control Mode** section:

1. **Step 1 — System Startup**: Click "Execute Next Step". Verifies `SYSTEM_READY`.
2. **Step 2 — Clean Belt Surface**: Ingests healthy rubber image. Result: `NO_DETECTIONS`, Conveyor `RUNNING`.
3. **Step 3 — Slight Scratch**: Ingests slight scratch image. Result: `WARNING` alert, Conveyor continues.
4. **Step 4 — Deep Scratch**: Ingests deep scratch image. Result: `WARNING` alert, Conveyor continues.
5. **Step 5 — Longitudinal Tear**: Ingests longitudinal tear image. Result: `CRITICAL DEFECT DETECTED!` Actuator command triggers `STOP_CONVEYOR`.
6. **Step 6 — Conveyor Motor Stop**: Motor de-energized via STM32 interlock. Speed drops to 0 RPM.
7. **Step 7 — Safety Stop Latched**: State machine enters `STOP_LATCHED`.
8. **Step 8 — Clean Frame While Latched**: Ingests clean image while latched. **CRITICAL PROOF**: System remains `STOP_LATCHED`. Motor does NOT restart.
9. **Step 9 — Authorized Operator Reset**: Submits `MINEGUARD_RESET_2026` token. Latch cleared, state returns to `SYSTEM_READY`.
10. **Step 10 — Sensor Anomaly Simulation**: Triggers simulated vibration/current overload warning.
