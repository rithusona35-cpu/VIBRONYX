# MineGuard AI — Orientation Regression Test Report
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**

---

## 1. Automated Regression Suite Verification
A permanent automated unit and integration regression test was established in:
[`tests/test_orientation_fusion.py`](file:///c:/Users/AnbuRithu/Downloads/yolo_output/tests/test_orientation_fusion.py)

### Test Results Summary
- `test_zero_degree_identity`: **PASS** (Identity mapping verified)
- `test_90_degree_cw_roundtrip`: **PASS** (Coordinates accurately map to original space)
- `test_180_degree_roundtrip`: **PASS** (Inverted points map accurately)
- `test_270_degree_roundtrip`: **PASS** (CCW points map accurately)
- `test_geometric_point_consistency`: **PASS** (Synthesized point coordinate error $\le 1.0\text{ px}$)
- `test_iou_and_fusion`: **PASS** (Multi-view redundant boxes cleanly fused via IoU 0.45)
- `test_failing_image_recovered_by_smart_router`: **PASS** (Failing portrait orientation successfully detected as `Longitudinal Tear`)

---

## 2. Full Regression Suite Status
- Total Unit Tests: **54 / 54 PASSED** (0 errors, 0 failures)
- Integration Pipeline Tests: **15 / 15 PASSED** (0 regressions)
- **Combined Test Suite: 69 / 69 PASSED (100% SUCCESS)**.
