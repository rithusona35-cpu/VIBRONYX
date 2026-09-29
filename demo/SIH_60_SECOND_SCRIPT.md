# MINEGUARD AI — 60-SECOND JUDGE PITCH SCRIPT
**SIH Problem Statement 26008:** AI-Based Industrial Conveyor Belt Defect Detection & Monitoring System

*Instructions for Student Presenter: Speak clearly, at a conversational pace. Point to the live dashboard on your laptop as you hit the timestamps below.*

---

### [00:00 – 00:10] The Industrial Problem
> "Respected judges, conveyor belts in mining transport thousands of tons of ore every hour. When trapped metal slices a belt longitudinally, the rip propagates hundreds of meters in minutes—causing millions in downtime and fire hazards. Manual inspection is too slow and dangerous to prevent belt failure."

---

### [00:10 – 00:20] Real-Time AI Detection
> "We present **MineGuard AI**—an autonomous vision and failsafe monitoring system. Powered by a production YOLO11s model running at 800-pixel resolution, our pipeline processes live conveyor feeds with an inference latency under 165 milliseconds on standard hardware, guaranteeing sub-second response."

---

### [00:20 – 00:30] 5-Class Industrial Taxonomy
> "Our AI doesn't just flag motion—it classifies defects into five distinct operational categories: Longitudinal Tears, Belt Splices, Deep Scratches, Slight Scratches, and Normal Belt. Each class maps directly to industrial severity levels from Info to Critical."

---

### [00:30 – 00:40] Failsafe Safety Latch & Motor Interlock
> "When a catastrophic tear is detected, our deterministic 9-state safety machine immediately dispatches an emergency `STOP_CONVEYOR` command and latches the state. Crucially, even if the camera sees clean belt on subsequent frames, the motor will NOT auto-restart until an authorized operator inspects the belt and submits a cryptographic reset token."

---

### [00:40 – 00:50] Autonomous Orientation & Aspect Ratio Recovery
> "In real mines, camera mounting angles shift. When an image arrives in portrait orientation, standard models miss defects entirely. Our **Smart Orientation Router** automatically detects aspect-ratio anomalies, evaluates multi-angle projections, and maps bounding boxes back to the native image space with zero lost defects."

---

### [00:50 – 01:00] Hardware Integration & Target Edge Deployment
> "Our software has passed 63 out of 63 rigorous regression tests. While shown today in safe laptop simulation, our architecture pairs an NVIDIA Jetson Orin Nano for edge AI with an STM32 microcontroller managing hardware watchdogs and failsafe industrial relays. MineGuard AI delivers uncompromising belt protection from pixel to motor."

---

### Demo Cues to Accompany the Speech:
1. **At 0:15**: Point to Dashboard header showing `MODEL INTEGRITY: PASS (SHA256 Verified)` and live camera feed.
2. **At 0:25**: Click Step 3 (Slight Scratch) on the demo panel to show warning status.
3. **At 0:35**: Click Step 4 (Longitudinal Tear)—show `STOP_CONVEYOR` red alert and latched status.
4. **At 0:45**: Click Step 5 (Portrait Recovery)—show side-by-side: 0 detections on baseline vs. 100% recovery with router.
5. **At 0:55**: Click Operator Reset—show safety latch clearing safely to `SYSTEM_READY`.
