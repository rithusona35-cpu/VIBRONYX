# Final Real-World Holdout Validation Report
**SIH 26008: Automated Conveyor Belt Defect Inspection**

## 1. Summary Statistics
- **Total Unseen Real-World Frames**: 13
- **Defective Frames Tested**: 12
- **Defective Frames Detected**: 12 (**100.0% Defect Recall**)
- **Clean Healthy Frames Tested**: 1
- **Clean Healthy Frames Rejected Without Defect Alarms**: 1 (**0.0% False Alarm Rate**)

## 2. Category Breakdown
- **REAL_HEALTHY**: 1 image (`frame_00021_jpg...`), 0 false defects generated (**PASSED**)
- **REAL_BELT_SPLICE**: 7 images, 100% splice detection (**PASSED**)
- **REAL_LONGITUDINAL_TEAR**: 3 images, 100% tear detection (**PASSED**)
- **REAL_DEEP_SCRATCH**: 1 image, 100% deep scratch detection (**PASSED**)
- **REAL_SLIGHT_SCRATCH**: 1 image, 100% slight scratch detection (**PASSED**)

*Note: Per Phase 11 safety rules, sample counts are explicitly reported rather than extrapolated.*
