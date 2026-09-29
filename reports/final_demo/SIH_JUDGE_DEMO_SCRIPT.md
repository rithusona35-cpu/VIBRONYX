# MINEGUARD AI — OFFICIAL SIH JUDGE DEMONSTRATION SCRIPT
## Problem Statement SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring System

**Audience**: SIH Technical & Domain Evaluation Panel  
**Format**: Live Walkthrough & Interactive Engineering Demo (5-7 Minutes)  
**Hardware Profile**: Industrial Edge AI / Laptop Host Demo Mode (Safe Simulation Active)

---

### Phase 1: Problem & System Overview (0:00 - 1:00)

**Speaker**:
> "Good morning/afternoon, respected judges. 
> In underground and opencast mining operations, conveyor belts run for kilometers carrying thousands of tons of ore continuously. Belt failures—specifically longitudinal tears caused by trapped metal or deep gouges—can rip kilometers of belting before human operators notice, costing millions of rupees in downtime and posing extreme safety hazards.
>
> Today, we present **MineGuard AI**, a real-time, orientation-robust, edge-deployable vision and hardware-interlocked safety monitoring system designed specifically for industrial conveyor belts.
>
> As shown on our dashboard, MineGuard AI operates with our production **YOLO11s** deep learning architecture trained on 5 industrial belt defect classes at 800×800 resolution. The system integrates a dual-path orientation-aware preprocessor, an active safety latch state machine, and industrial relay hardware simulation."

---

### Phase 2: Live Baseline & Normal Operation (1:00 - 2:00)

**Action**: Upload Clean Belt Image (`demo_images/frame_00001_jpg...` or Step 2 button).  
**Speaker**:
> "Let's first demonstrate standard, steady-state operation.
> Here we feed an image of a running, undamaged conveyor belt.
>
> Notice the system output:
> - **Inference Route**: Fast Path (0° native horizontal pass) executing in approximately 450-550ms on laptop CPU.
> - **Detection**: 0 defects found (`Normal Belt`).
> - **Hardware State**: Conveyor status remains **RUNNING (GREEN)**.
> - **Telemetry**: No latches are triggered. The conveyor continues uninterrupted transport."

---

### Phase 3: Defect Detection & Classification (2:00 - 3:00)

**Action**: Upload Slight Scratch (`sample_002_scratch.jpg` / Step 3), followed by Serious Defect (`sample_001_tear.jpg` / Step 4).  
**Speaker**:
> "Now, we simulate surface wear and severe damage:
>
> 1. **Slight Scratch**: When a surface scratch is detected, the system bounds the defect accurately with confidence ~40-50%, classifies it as `Slight Scratch (Severity: WARNING)`, logs the defect to the maintenance database, but issues a `CONTINUE_CONVEYOR` command so production is not unnecessarily halted.
>
> 2. **Critical Defect (Deep Scratch / Longitudinal Tear)**: Now we introduce a critical longitudinal rip.
> Watch the instant reaction:
> - **Vision Layer**: Model immediately detects `Longitudinal Tear` with high confidence.
> - **Decision Layer**: Severity is categorized as **CRITICAL**.
> - **Hardware Controller**: Within milliseconds, a `STOP_CONVEYOR` emergency trigger is dispatched to the industrial motor relay circuit, flashing the dashboard red."

---

### Phase 4: The Orientation Robustness Breakthrough (3:00 - 4:30)

**Action**: Run Step 5 (Portrait Failure Recovery demonstration).  
**Speaker**:
> "Respected judges, here is our key engineering innovation that solves a major failure mode in real-world deployments: **The SmartOrientationRouter**.
>
> In underground mines, conveyor cameras often capture oblique angles, or maintenance personnel take vertical, portrait photos with mobile inspection tablets (e.g., 1844×4080 vertical aspect ratio).
>
> If we pass this portrait image directly to the baseline YOLO11s model without orientation intelligence, severe letterboxing and aspect compression causes the model to output **0 detections—a catastrophic false negative on a torn belt!**
>
> Watch what MineGuard AI does automatically:
> 1. **Fast Path**: Evaluates the native portrait frame. Result: No detections.
> 2. **Fallback Path Activated**: The SmartOrientationRouter detects high aspect ratio / no detections and instantly evaluates canonical industrial conveyor orientations (90° and 270° multi-view).
> 3. **Defect Recovery**: At 270°, the tear is immediately detected at over 60% confidence!
> 4. **Inverse Bounding Box Coordinate Mapping**: Our vector transformation algorithm projects the rotated bounding box coordinates precisely back to the original portrait coordinate space with **zero-pixel drift**.
>
> As you can see side-by-side on screen: **Baseline: MISSED DEFECT. MineGuard AI Smart Router: 100% RECOVERED & LOCALIZED.**"

---

### Phase 5: Fail-Safe Industrial Safety Latch & Operator Reset (4:30 - 5:30)

**Action**: Run Step 6 (Feed clean frame after critical defect, then click Authorized Reset).  
**Speaker**:
> "In industrial safety standards (ISO 13849 / IEC 62061), a vision system must NEVER automatically restart heavy machinery simply because the defect moved out of camera view.
>
> Watch this:
> - After the critical tear stopped the belt, the camera now sees a clean belt frame again.
> - Notice the dashboard: Vision state is `NO_DETECTIONS`, **BUT the Safety Latch remains locked in `STOP_LATCHED`**.
> - The conveyor cannot restart automatically. A hazardous restart is physically prevented.
>
> Only after authorized maintenance personnel inspect the physical belt and issue an **AUTHORIZED OPERATOR RESET** (demonstrated here by clicking the Reset button with operator authorization) does the system release the relay and transition conveyor state back to `ARMED / RUNNING`."

---

### Phase 6: Edge Deployment & Physical Hardware Integration (5:30 - 6:00)

**Speaker**:
> "Today, for demonstration safety, our hardware controller runs in **VERIFIED SIMULATION MODE**—every command (STOP, RUN, LATCH, RESET) is logged deterministically without firing physical 400V relays on the laptop.
>
> For plant deployment:
> - The software stack is pre-configured for NVIDIA Jetson Orin Nano / Xavier NX using TensorRT FP16 acceleration (~38 FPS).
> - Optocoupled GPIO pins drive industrial 24V PLC relays (normally closed fail-safe loop).
> - If power or camera feed is lost, the hardware watchdog automatically fails safe to STOP.
>
> Thank you, judges. We are now ready for your questions and live interactive testing!"
