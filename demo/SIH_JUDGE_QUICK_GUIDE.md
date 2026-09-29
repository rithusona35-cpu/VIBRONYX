# MINEGUARD AI — JUDGE QUICK REFERENCE GUIDE
**SIH Problem Statement 26008:** AI-Based Industrial Conveyor Belt Defect Detection & Monitoring System

---

### WHAT IS THE PROBLEM?
High-capacity conveyor belts in mining operations transport thousands of tons of ore per hour under harsh conditions. Trapped tramp iron or jagged rocks can slice belts longitudinally or rip splices apart. If undetected, a tear propagates hundreds of meters within minutes, causing millions of dollars in catastrophic damage, conveyor fires, and prolonged mine shutdowns. Manual visual inspection is hazardous, intermittent, and incapable of catching sub-second rips.

---

### WHAT DOES MINEGUARD DETECT?
MineGuard AI detects and classifies conveyor surface anomalies into a strict 5-class industrial taxonomy:
1. **Longitudinal Tear** (`CRITICAL`): Belt ripped along its travel axis. Immediate threat of total belt severance.
2. **Belt Splice** (`CRITICAL`): Mechanical fastener pull-out or vulcanized splice joint separation.
3. **Deep Scratch** (`WARNING`): Structural gouge penetrating beyond top rubber cover into carcass fabric.
4. **Slight Scratch** (`INFO / WARNING`): Minor surface abrasion; logged for predictive maintenance.
5. **Normal Belt** (`HEALTHY`): Clean, defect-free rubber surface; conveyor continues at full speed.

---

### HOW DOES AI WORK?
1. **Optical Capture**: High-speed camera captures conveyor surface frames.
2. **Preprocessing & EXIF Normalization**: Input frames are standardized to 800×800 without aspect-ratio distortion.
3. **Smart Orientation Router**: Evaluates aspect ratio and conveyor direction. Standard landscape frames execute the ultra-fast single-pass path (P50 = 163.85ms). Portrait or anomalous presentations activate fallback multi-view fusion (0°, 90°, 270°).
4. **YOLO11s Deep Neural Network**: Evaluates features across 9.43M parameters trained on high-resolution industrial belt datasets.
5. **Inverse Coordinate Transformation**: Multi-view bounding boxes are mapped mathematically back to the native image space with duplicate suppression via IoU clustering.
6. **Failsafe Safety State Machine**: Evaluates detection severity against industrial operating rules and issues instant motor commands.

---

### WHAT HAPPENS WHEN A CRITICAL DEFECT IS FOUND?
1. The AI engine flags `CRITICAL` severity (`Longitudinal Tear` or `Belt Splice`).
2. The safety state machine immediately issues a `STOP_CONVEYOR` command.
3. A hardware safety latch is immediately engaged (`is_latched = True`).
4. Visual alerts (red warning banners, audible alarms, and fault logs) trigger on the operator dashboard.
5. In physical deployment, the STM32 microcontroller drops the 24V motor safety contactor within milliseconds.

---

### WHY DOES THE CONVEYOR STAY STOPPED?
**Failsafe Latching Rule:**
When a tear stops the conveyor, the torn section travels slightly past the camera FOV or stops right under it. Subsequent video frames may see clean rubber.
If the system relied solely on instantaneous detections, seeing a clean frame would immediately re-energize the motor—pulling the torn belt apart under tension!
To prevent catastrophic re-energization:
- The `STOP_CONVEYOR` state is **latched in hardware and software**.
- Subsequent clean frames **cannot** clear the latch.
- The conveyor stays stopped until an authorized operator inspects the belt on-site and issues an explicit cryptographic reset token.

---

### HOW DOES PORTRAIT RECOVERY WORK?
Smartphone cameras or field cameras installed with 90° orientation mismatch often yield 0 detections on baseline single-orientation models.
MineGuard AI’s **SmartOrientationRouter**:
1. Detects non-standard aspect ratios ($W/H < 0.75$) or unexpected zero detections on narrow views.
2. Automatically routes the image through canonical multi-angle evaluations ($90^\circ$ CW and $270^\circ$ CW).
3. Detects the defect in canonical alignment ($conf \approx 60.4\%$).
4. Applies an exact inverse affine transformation matrix to project bounding boxes back into the native camera coordinates.
5. Suppresses duplicate candidate boxes via IoU filtering ($thresh = 0.45$).

---

### WHAT IS THE ROLE OF STM32?
The STM32 microcontroller serves as the **Industrial Failsafe Watchdog & Relay Controller**:
- Receives heartbeat packets and actuator commands over CRC-8 validated serial communication.
- Directly controls optoisolated industrial relays driving the Variable Frequency Drive (VFD) and emergency brake circuit.
- Runs an independent 2.0-second hardware watchdog timer. If the host computer crashes or hangs, the STM32 automatically trips the emergency stop relay.

---

### WHAT IS THE ROLE OF JETSON ORIN NANO?
The NVIDIA Jetson Orin Nano is the **Target Industrial Edge AI Deployment Platform**:
- Houses the GPU edge inference engine directly in a ruggedized IP66 gantry enclosure next to the conveyor.
- Runs the frozen YOLO11s model compiled to TensorRT INT8/FP16, achieving >30 FPS real-time conveyor scanning at line speeds up to 6 m/s.
- Communicates locally with the STM32 via RS-485 / Modbus RTU.

---

### WHAT SENSORS ARE USED?
1. **Primary Vision**: High-resolution industrial global shutter color/monochrome camera with DirectShow API.
2. **Auxiliary Belt Encoders**: Belt tachometer encoder for distance tracking (target industrial deployment).
3. **Structured Laser Line**: Laser triangulation profiler for 3D gouge depth verification (target hardware deployment).

---

### WHAT HAS BEEN ACTUALLY TESTED?
✅ **Production Model Verification**: Checked byte-for-byte against immutable SHA256 checksum.
✅ **Full Inference Pipeline**: End-to-end testing with real mining conveyor images across all 5 classes.
✅ **Orientation Recovery & Bounding Box Transformation**: Mathematically verified with sub-pixel inverse mapping parity.
✅ **Laptop Webcam Capture & Pipeline Benchmark**: DirectShow Index 0 tested with decoupled Latest-Frame-Wins asynchronous buffer (40 FPS raw capture, 7.56 FPS decoupled inference).
✅ **Web Dashboard & REST APIs**: All 21 API endpoints tested with live image uploads, telemetry, and control signals.
✅ **Safety State Machine & Latch**: Verified through 63 automated unit and regression tests (100% PASS).
✅ **Continuous 5-Minute Stability Stress Test**: Over 1,200 continuous inference frames without memory leaks or degradation.

---

### WHAT REMAINS SIMULATION?
⚠️ **24V Physical Motor Contactor Energization**: For lab and presentation electrical safety, actuator signals are emitted in `SIMULATION` mode (`PHYSICAL_HARDWARE_VERIFIED = False`). Actuator commands (`STOP_CONVEYOR`, `CONTINUE`, `ALERT`, `RESET`) and CRC-8 packet framing are verified in software, ready for physical optoisolated relay wiring on-site.
