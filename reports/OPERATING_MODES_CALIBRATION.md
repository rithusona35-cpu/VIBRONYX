# Dual Operating Mode Calibration Guide
**MineGuard AI — Evidence-Based Operating Modes for Industrial Conveyors**
*Calibrated over 13 controlled confidence thresholds (0.10 to 0.70)*

---

## Mode A: DEMO / DEFECT-SENSITIVITY MODE (Recommended Default)
- **Confidence Threshold**: `0.25`
- **NMS IoU**: `0.50`
- **Target Setting**: High-risk industrial environments (underground coal mining, bulk port terminals) and live demonstration.
- **Design Intent**: Maximum sensitivity to dangerous structural failures where a single missed tear can cause millions in equipment damage.
- **Performance Characteristics**:
  - Longitudinal Tear Recall: **94.62%** (88 / 93 detected)
  - Belt Splice Recall: **100.0%** (41 / 41 detected)
  - Deep Scratch Recall: **89.36%** (42 / 47 detected)
  - Slight Scratch Recall: **73.53%** (50 / 68 detected)
  - Defect-Only Recall: **88.76%**
  - Defect-Only Precision: **77.17%**
  - Real-World Defect Detection: **100.0% (11/11 frames detected)**
  - Clean Rubber False Alarm Rate: **0.0% (0 false alarms)**

---

## Mode B: CONSERVATIVE INSPECTION MODE (High-Precision Routine Operations)
- **Confidence Threshold**: `0.40`
- **NMS IoU**: `0.50`
- **Target Setting**: Automated continuous 24/7 monitoring where nuisance alarms must be minimized to avoid control-room fatigue.
- **Design Intent**: Suppresses superficial surface scuffs, optical glare streaks, and micro-dust traces.
- **Performance Characteristics**:
  - Defect-Only Precision: **84.12%** (+6.95% gain over Mode A)
  - Longitudinal Tear Recall: **89.25%** (83 / 93 detected)
  - Belt Splice Recall: **100.0%** (41 / 41 detected)
  - Deep Scratch Recall: **80.85%** (38 / 47 detected)
  - Slight Scratch Recall: **41.18%** (superficial hairline abrasions filtered)
  - False Alarms: Reduced by **66.2%** (from 71 false positives to 24)
