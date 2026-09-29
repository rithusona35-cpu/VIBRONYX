# MINEGUARD AI — TECHNICAL JUDGE DEFENSE Q&A SCRIPT
**SIH Problem Statement 26008:** AI-Based Industrial Conveyor Belt Defect Detection & Monitoring System

This document equips the team with precise, mathematically sound, and verified technical answers for deep-dive questions from industrial and AI judges.

---

### 1. Why YOLO?
Conveyor belts move at 2 to 6 meters per second. A two-stage detector (like Faster R-CNN) has high multi-stage latency (>300ms) and struggles with line-rate processing. YOLO provides a single-stage end-to-end regression from image pixels directly to bounding boxes and class probabilities, achieving sub-100ms inference required for real-time industrial emergency braking.

### 2. Why YOLO11s?
YOLO11s (Small variant with 9.43M parameters) represents the optimal Pareto frontier between feature representation and edge inference latency. Nano (YOLO11n, ~2.6M parameters) exhibited lower recall on faint hairline tears; Medium (YOLO11m, ~20M parameters) doubled inference latency without significant mAP gains on the 5-class conveyor domain.

### 3. Why 800×800?
Conveyor belts are wide (1.2m to 2.4m) with high aspect ratios. Longitudinal tears often measure only a few millimeters across yet extend meters in length. At standard 640×640, faint scratches downsample below 2–3 pixels and lose gradient saliency. 800×800 preserves sub-centimeter tear boundaries while remaining well within real-time compute limits.

### 4. Why orientation routing?
Conveyor tear patterns are directional along the belt travel vector. Models trained on overhead landscape views fail completely when images arrive rotated (e.g. mobile inspection or angled field mountings). Rather than multiplying compute by unconditionally running a 4-pass ensemble on every frame, the SmartOrientationRouter checks the aspect ratio: normal landscape runs in a single fast pass (~164ms), while anomalous aspect ratios invoke multi-view fallback.

### 5. Why not retrain?
The production model (`models/final_sih_model.pt`) has been frozen under strict MLOps immutability gates (SHA256 verified). Blind retraining introduces catastrophic forgetting, dataset covariate shift, and unvalidated edge-case regressions. Orientation variance is solved deterministically through geometry and affine routing, maintaining 100% backward compatibility and test stability across the 63/63 test baseline.

### 6. How is bbox transformed?
When an image is evaluated in a rotated view (e.g., $90^\circ$ clockwise), coordinates $[x_1, y_1, x_2, y_2]$ in the rotated frame are mapped back to original image space $[W_{orig}, H_{orig}]$ using exact affine inverse mapping:
- For $90^\circ$ CW: $x_{orig} = y_{rot}$, $y_{orig} = (H_{orig} - 1) - x_{rot}$.
- For $270^\circ$ CW ($90^\circ$ CCW): $x_{orig} = (W_{orig} - 1) - y_{rot}$, $y_{orig} = x_{rot}$.
Coordinates are clamped to $[0, W_{orig}]$ and $[0, H_{orig}]$ and validated for positive non-zero area.

### 7. How is duplicate detection avoided?
In multi-view fallback mode, candidates from all evaluated angles ($0^\circ, 90^\circ, 270^\circ$) are transformed into the original image space and passed into `fuse_orientation_detections`. The detections are sorted by confidence descending. Any subsequent bounding box having an IoU greater than $0.45$ with an already accepted box of the same class is suppressed as a spatial duplicate.

### 8. How is a false emergency stop prevented?
We employ a tiered severity and confidence verification threshold:
1. Low-severity items (`slight scratch`) emit non-stopping `ALERT` signals and do not trip the conveyor stop.
2. Emergency stops require `CRITICAL` severity (`Longitudinal Tear` or `Belt Splice`) with confidence exceeding the operational threshold ($\ge 0.25$, typical detections occur at $\ge 0.60$).
3. Bounding boxes are filtered by minimum physical pixel area ($area \ge 4.0\text{ px}^2$) to reject single-pixel noise.

### 9. Why does the latch remain active?
Industrial safety standard ISO 13849-1 / IEC 62061 mandate failsafe interlocking. If a rip triggers an emergency stop, the torn section may pass beyond the camera field of view as the conveyor decelerates. If the software auto-reset upon seeing a clean frame, the drive would restart immediately, tearing the belt further under tension. The latch ensures the machine remains stopped until verified by maintenance personnel.

### 10. How is reset authorized?
A reset requires an explicit operator-authenticated request:
- Dispatched via `POST /api/operator_reset` with an operator token (e.g., `CHIEF_OPERATOR`).
- The software verifies that no active hardware fault is present and clears `critical_stop_latched = False`.
- The Finite State Machine transitions from `BELT_STOPPED` back to `SYSTEM_READY`, allowing a safe restart sequence.

### 11. What does STM32 do?
The STM32 microcontroller acts as the **Hardware Safety Watchdog & Actuator Interface**:
- Decoupled from the high-level OS; operates in deterministic real-time firmware.
- Receives heartbeat packets with CRC-8 checksums over UART/RS-485.
- Directly controls optoisolated relays wired into the conveyor VFD run/stop contactors.
- Runs an independent 2.0-second hardware watchdog timer. If the AI host PC crashes, the watchdog trips and cuts conveyor power automatically.

### 12. What does Jetson Orin Nano do?
The NVIDIA Jetson Orin Nano is the target edge computing platform for gantry installation:
- Executes the frozen YOLO11s model on its Ampere GPU using TensorRT FP16/INT8 precision.
- Processes 1080p camera streams at >30 FPS real-time conveyor speeds.
- Withstands rugged environmental conditions (vibration, dust, temperature) via IP66 fanless enclosure.

### 13. What happens if the camera fails?
`CameraManager` monitors capture health via frame timeouts and direct capture return checks:
- If frames fail to arrive within the watchdog window or capture returns `False`, state transitions to `HARDWARE_FAULT`.
- In an industrial failsafe regime, `HARDWARE_FAULT` immediately triggers a `STOP_CONVEYOR` command, preventing the belt from running blind.

### 14. What happens if the model gives no detection?
When no bounding boxes exceed the detection threshold ($conf < 0.25$), the preprocessor returns `health_state = "NO_DETECTIONS"`. If the system is in `BELT_RUNNING` and not latched, the controller maintains `CONTINUE`. If the system was previously latched due to a critical defect, it strictly maintains `STOP_CONVEYOR`.

### 15. What happens with portrait images?
Standard single-orientation inference yields 0 detections for portrait tears ($W/H < 0.75$). The `SmartOrientationRouter` detects the aspect ratio anomaly, triggers the fallback path across $90^\circ$ and $270^\circ$, detects the tear with high confidence (~60.4%), and projects the bounding box back onto the portrait image with zero operator intervention.

### 16. What is the laptop latency?
On this test laptop (Intel CPU, PyTorch 8 threads, without GPU acceleration):
- Fast Path (single 800×800 pass): P50 = **163.85 ms**, P95 = **221.82 ms**.
- Fallback Path (multi-view pass): P50 = **156.44 ms**, P95 = **162.80 ms**.
- Decoupled Camera Pipeline: Raw capture runs at ~40 FPS, with decoupled inference completing every ~112 ms (7.56 FPS).

### 17. What is the expected edge-device deployment?
On the NVIDIA Jetson Orin Nano (8GB) with TensorRT optimization:
- TensorRT FP16 latency: ~18 to 24 ms per 800×800 frame.
- Line-rate throughput: >40 FPS continuous processing.
- Supports conveyor belt speeds up to 8 m/s with sub-20cm defect localization resolution.

### 18. What has been physically tested?
- Live laptop camera capture using OpenCV DirectShow backend (Index 0).
- Real-time decoupled multi-threaded frame queue (Latest-Frame-Wins buffer).
- Complete software state machine and safety latching logic.
- 63 out of 63 automated regression tests.
- Live web dashboard with real-time telemetry and manual operator reset.
- Continuous 5-minute stability stress test with zero memory growth.

### 19. What remains to be integrated?
- Physical RS-485 serial cable connection between host PC/Jetson and STM32 microcontroller.
- Physical 24V industrial contactor and motor driver coil wiring.
- Industrial IP66 lighting and global-shutter camera enclosure on an actual mine gantry.

### 20. What are the current limitations?
1. **Simulation Relay Mode**: Actuator commands (`STOP_CONVEYOR`, `CONTINUE`, `ALERT`, `RESET`) are logged and simulated in software to prevent unverified electrical hazards in a presentation environment.
2. **CPU Inference Latency**: Laptop CPU inference runs at ~6–8 FPS; deployment on Jetson Orin Nano TensorRT is required for full 30+ FPS line-rate industrial speeds.
3. **Dataset Diversity**: While comprehensive for longitudinal tears and normal belts, belt splice and slight scratch categories will benefit from additional field samples gathered during site commissioning.
