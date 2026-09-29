# MINEGUARD AI — Final SIH System Inventory
**Project**: SIH 26008 — AI-Based Industrial Conveyor Belt Defect Detection and Monitoring System  
**Audit Timestamp**: 2026-09-21  
**Integrity State**: MODEL_LOCKED | PRODUCTION_IMMUTABLE  

---

## 1. Production Model
- **Filesystem Location**: `models/final_sih_model.pt`
- **Architecture**: YOLO11s (Ultralytics YOLO11 Small)
- **Input Dimensions**: 800 × 800 RGB
- **Parameter Count**: 9,429,727 parameters
- **Weights File Size**: 18.32 MB (19,209,795 bytes)
- **SHA256 Checksum**: `2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3`
- **Operational Constraint**: Byte-for-byte immutable; fine-tuning and retraining permanently disabled.

## 2. Backend Entry Point
- **Primary Server File**: `app_backend_server.py`
- **Framework**: Python Flask with threaded request processing
- **Host / Port**: `http://127.0.0.1:5000` (Bound to `0.0.0.0:5000`)
- **Initialization**: Automatically mounts YOLO11s in-memory, loads hardware bridge, and serves dashboard.

## 3. Unified Preprocessor
- **File**: `unified_preprocessor.py`
- **Class**: `MineGuardInferenceEngine`
- **Features**:
  - Image decoding from raw multipart bytes
  - EXIF orientation normalization
  - Extreme portrait aspect ratio detection ($W/H < 0.75$)
  - Letterbox scaling with deterministic un-letterbox coordinate mapping
  - Deterministic post-processing to standard SIH taxonomy

## 4. Smart Orientation Router
- **File**: `orientation_aware_fusion.py`
- **Class**: `SmartOrientationRouter`
- **Functions**:
  - `detect_orientation_views`: Rotates image at specified angles (0°, 90°, 270°) and predicts
  - `transform_bbox_to_original`: Exact affine coordinate inverse transformation back to original camera coordinate space
  - `fuse_orientation_detections`: NMS spatial duplicate suppression across orientation views
  - Fast Path: 0° landscape inference ($\sim 800-960$ ms on Laptop CPU)
  - Fallback Path: Evaluates 90° CW and 270° CW for portrait or suspicious aspect ratios

## 5. API Routes
- `GET /`: Serves operator inspection web dashboard
- `GET /api/model_info`: Returns active model metadata, thresholds, input resolution, classes
- `GET /api/hardware_status`: Returns current telemetry (telemetry frame, motor state, relay, safety latch)
- `GET /api/control_signal`: Machine-readable safety signal (`STOP_CONVEYOR` vs `CONTINUE`)
- `POST /api/detect`: Multipart image upload detection with real-time hardware dispatch
- `GET /api/demo/manifest`: Returns deterministic 6-step SIH demo sequence
- `GET /api/demo/<int:sequence_id>`: Executes specific step from manifest
- `POST /api/hardware/reset`: Authorized operator reset for safety latch
- `GET /api/laptop_validation/<action>`: Executes real-time validation actions (`clean_belt`, `defect`, `portrait`, `orientation`, `api`, `hardware`, `full_test`)

## 6. Frontend
- **Templates**: `templates/index.html`
- **Styles**: `static/css/style.css` (Industrial glassmorphism, responsive telemetry widgets)
- **Logic**: `static/js/main.js`
- **Key Modules**:
  - Live Detection Canvas (drawn bounding boxes with class colors & confidence badges)
  - SIH Demonstration Mode tab (Step-by-step execution 1 to 6)
  - Laptop Validation Tab (Instant pass/fail verification buttons)
  - Hardware Control panel with visual Safety Latch indicator and Authorized Reset trigger

## 7. Hardware Bridge
- **File**: `hardware_controller.py`
- **Class**: `ConveyorHardwareController` (`hardware_bridge`)
- **Mode**: `SIMULATION` (Physical relays and GPIO are safely simulated in software; zero electrical hazard)
- **Signals**: `CONTINUE`, `WARNING_ALERT`, `STOP_CONVEYOR`, `SAFE_STATE`

## 8. Safety State Machine
- **Decoupled Architecture**:
  - `CURRENT_FRAME_STATE`: Perception output of the latest camera frame (`NO_DETECTIONS`, `NORMAL_BELT`, `DEFECT_DETECTED`, `ANALYSIS_ERROR`)
  - `SAFETY_LATCH_STATE`: Independent safety interlock (`NORMAL` vs `CRITICAL_STOP_LATCHED`)
- **Invariant**: Once a critical defect (Longitudinal Tear, Deep Scratch, Belt Splice) trips the latch, subsequent clean frames *cannot* release the emergency stop until an authenticated operator reset command is issued.

## 9. Existing Demo System
- **Files**: `demo/demo_manifest.json`, `demo/demo_config.json`
- **Sequence**:
  1. Clean Belt (Zero false alarms)
  2. Belt Splice (Critical joint detection)
  3. Slight Scratch (Preventive warning)
  4. Deep Scratch (Structural risk)
  5. Longitudinal Tear (Emergency catastrophic failure)
  6. Safety Latch & Authorized Reset

## 10. Existing Tests
- `tests/test_model_contract.py`: Checksum, parameter count, class count
- `tests/test_class_mapping.py`: Verifies all 5 classes match SIH specifications
- `tests/test_bbox_scaling.py`: Checks coordinate bounds and letterboxing
- `tests/test_threshold_behavior.py`: Sensitivity curve evaluation
- `tests/test_no_detection_state.py`: Clean rubber zero false positive gate
- `tests/test_hardware_safety.py`: Safety latch and reset verification
- `tests/test_final_integration.py`: End-to-end integration
- `tests/test_orientation_fusion.py`: Multi-view fusion and coordinate transformation

## 11. Existing Reports
- `reports/laptop_test/LAPTOP_REAL_WORLD_TEST_REPORT.md` (24-section comprehensive validation report)
- `reports/laptop_test/LAPTOP_TEST_SUMMARY.json` (Machine-readable test results)
- `reports/laptop_test/GOLDEN_TEST_SET.csv` (45 balanced test images)
- `reports/laptop_test/DATASET_INVENTORY.csv` (3,389 images cataloged)

## 12. Existing Demo Images
- `demo_images/`: 12 canonical test images
- `golden_test_images/`: 12 curated test frames
- `known_defect_tests/`: 25 verified industrial samples
- `real_world_validation_v2/`: 50 multi-class real-world captures
- `uploads/last_upload.jpg` & `tests/fixtures/portrait_conveyor_failure.jpg`: Portrait failure recovery targets

## 13. Existing Model Configuration
- Input: 800 × 800 RGB
- Confidence: 0.25 (SIH Demo Defect Sensitivity)
- IoU: 0.50
- Device: CPU (Intel/AMD Laptop Architecture)

## 14. Existing Class Mapping
```
ID 0: Belt Splice
ID 1: Deep Scratch
ID 2: Longitudinal Tear
ID 3: Normal Belt
ID 4: Slight Scratch
```
All system layers (YOLO11s checkpoint, unified preprocessor, frontend styles, hardware severity engine) maintain 100% bijective alignment with this mapping.
