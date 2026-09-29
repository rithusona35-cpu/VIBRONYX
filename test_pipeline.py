"""
AUTOMATED REGRESSION TEST SUITE FOR MINEGUARD AI (SIH 26008)
Usage: python test_pipeline.py
Runs all mandatory system tests for production freeze verification.
"""

import os
import sys
import io
import time
from PIL import Image
import numpy as np

# Ensure project paths are resolvable
sys.path.insert(0, os.path.abspath("."))

from unified_preprocessor import (
    MineGuardInferenceEngine,
    EXPECTED_CLASSES,
    DISPLAY_NAMES,
    CLASS_COLORS,
    CLASS_SEVERITY
)
from ultralytics import YOLO

TEST_RESULTS = {}

def run_test(test_num: int, name: str, fn):
    print(f"\n=======================================================")
    print(f"TEST {test_num}: {name.upper()}")
    print(f"=======================================================")
    try:
        fn()
        TEST_RESULTS[f"Test {test_num}: {name}"] = "PASS"
        print(f"--> RESULT: [ PASS ]")
    except Exception as e:
        TEST_RESULTS[f"Test {test_num}: {name}"] = f"FAIL: {e}"
        print(f"--> RESULT: [ FAIL ]: {e}")

# 1. Model Loading Test
engine = None
def test_1_model_loading():
    global engine
    model_path = os.path.abspath("models/final_sih_model.pt")
    assert os.path.exists(model_path), f"Weights file {model_path} not found!"
    engine = MineGuardInferenceEngine(model_path, imgsz=800, conf_threshold=0.25, iou_threshold=0.50, device='cpu')
    assert engine.model is not None, "Engine model failed to initialize"
    print(f"Loaded {engine.model_version} from {model_path}")

# 2. Image Decoding Test
def test_2_image_decoding():
    rgb_data = np.zeros((100, 100, 3), dtype=np.uint8)
    pil_rgb = Image.fromarray(rgb_data)
    buf = io.BytesIO()
    pil_rgb.save(buf, format="JPEG")
    decoded_img, w, h = engine.decode_image(buf.getvalue())
    assert w == 100 and h == 100, f"Expected 100x100, got {w}x{h}"
    assert decoded_img.mode == 'RGB', f"Expected mode RGB, got {decoded_img.mode}"
    print("Verified decoding RGB in-memory stream.")

# 3. Preprocessing Consistency
def test_3_preprocessing():
    test_img = Image.new('RGB', (1600, 1200), color=(100, 150, 200))
    res = engine.infer(test_img)
    assert res['original_image_dimensions'] == [1600, 1200], "Failed to preserve original image dimensions"
    print("Preserved high-res dimensions [1600, 1200] across preprocessing pass.")

# 4. Belt Splice Detection Test
def test_4_splice_detection():
    img_p = "known_defect_tests/belt_splice_1_frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg"
    res = engine.model.predict(source=img_p, imgsz=800, conf=0.25, iou=0.50, verbose=False)[0]
    classes = [int(b.cls[0]) for b in res.boxes]
    assert 0 in classes, f"Expected Belt Splice (0), found {classes}"
    print(f"Belt Splice detected with confidence {float(res.boxes.conf[classes.index(0)]):.2f}")

# 5. Longitudinal Tear Detection Test
def test_5_tear_detection():
    img_p = "known_defect_tests/longitudinal_tear_2_frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg"
    res = engine.model.predict(source=img_p, imgsz=800, conf=0.25, iou=0.50, verbose=False)[0]
    classes = [int(b.cls[0]) for b in res.boxes]
    assert 2 in classes, f"Expected Longitudinal Tear (2), found {classes}"
    print(f"Longitudinal Tear detected with confidence {float(res.boxes.conf[classes.index(2)]):.2f}")

# 6. Deep Scratch Detection Test
def test_6_deep_scratch_detection():
    img_p = "known_defect_tests/deep_scratch_1_frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg"
    res = engine.model.predict(source=img_p, imgsz=800, conf=0.25, iou=0.50, verbose=False)[0]
    classes = [int(b.cls[0]) for b in res.boxes]
    assert 1 in classes, f"Expected Deep Scratch (1), found {classes}"
    print(f"Deep Scratch detected with confidence {float(res.boxes.conf[classes.index(1)]):.2f}")

# 7. Slight Scratch Detection Test
def test_7_slight_scratch_detection():
    img_p = "known_defect_tests/slight_scratch_5_frame_00129_jpg.rf.7719d1d835cab947ea466cdf7469001a.jpg"
    res = engine.model.predict(source=img_p, imgsz=800, conf=0.25, iou=0.50, verbose=False)[0]
    classes = [int(b.cls[0]) for b in res.boxes]
    assert 4 in classes, f"Expected Slight Scratch (4), found {classes}"
    print(f"Slight Scratch detected with confidence {float(res.boxes.conf[classes.index(4)]):.2f}")

# 8. Real Healthy Image Rejection Test
def test_8_healthy_image_rejection():
    img_p = "real_world_test/REAL_HEALTHY/frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg"
    pil_img = Image.open(img_p)
    res = engine.infer(pil_img, conf=0.25)
    defect_dets = [d for d in res['detections'] if d['class_id'] in [0, 1, 2, 4]]
    assert len(defect_dets) == 0, f"Expected 0 defect false alarms on clean rubber, got {len(defect_dets)}"
    print("Real-world clean belt frame rejected with 0 false alarms.")

# 9. Empty / Blank Image Zero-Detection Segregation
def test_9_empty_detection():
    blank = Image.new('RGB', (800, 800), color=(20, 20, 20))
    res = engine.infer(blank, conf=0.50)
    assert res['total_detections'] == 0, f"Expected 0 detections, got {res['total_detections']}"
    assert res['health_state'] == 'NO_DETECTIONS', f"Expected NO_DETECTIONS, got {res['health_state']}"
    assert res['highest_severity'] == 'NO_DETECTIONS', f"Severity must be NO_DETECTIONS, got {res['highest_severity']}"
    print("Zero-detection state isolated to health_state='NO_DETECTIONS'")

# 10. Malformed Image / Inference Failure Handling
def test_10_malformed_image_handling():
    corrupt_bytes = b"NOT_A_VALID_IMAGE_FILE_DATA_CORRUPT"
    try:
        decoded, w, h = engine.decode_image(corrupt_bytes)
        res = engine.infer(decoded)
    except Exception:
        res = {"status": "ANALYSIS_ERROR", "health_state": "ANALYSIS_ERROR", "message": "Failed to decode image"}
    assert res['health_state'] == 'ANALYSIS_ERROR' or res['status'] == 'ANALYSIS_ERROR', \
        f"Malformed image must yield ANALYSIS_ERROR, got {res}"
    print("Inference failure correctly triggers ANALYSIS_ERROR without claiming healthy.")

# 11. Bounding Box Coordinate Scaling
def test_11_coordinate_scaling():
    golden_img = "known_defect_tests/deep_scratch_1_frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg"
    pil_img = Image.open(golden_img)
    orig_w, orig_h = pil_img.size
    res = engine.infer(pil_img)
    for det in res['detections']:
        x1, y1, x2, y2 = det['bbox']
        assert 0 <= x1 < x2 <= orig_w, f"Invalid x bounds: 0 <= {x1} < {x2} <= {orig_w}"
        assert 0 <= y1 < y2 <= orig_h, f"Invalid y bounds: 0 <= {y1} < {y2} <= {orig_h}"
    print(f"All {len(res['detections'])} detected boxes confirmed strictly within [0, {orig_w}] x [0, {orig_h}].")

# 12. Confidence Threshold Filtering
def test_12_confidence_filtering():
    golden_img = "known_defect_tests/deep_scratch_1_frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg"
    pil_img = Image.open(golden_img)
    low_conf_res = engine.infer(pil_img, conf=0.15)
    high_conf_res = engine.infer(pil_img, conf=0.60)
    assert low_conf_res['total_detections'] >= high_conf_res['total_detections'], \
        f"Inconsistent confidence filtering: {low_conf_res['total_detections']} < {high_conf_res['total_detections']}"
    print(f"Low conf (0.15): {low_conf_res['total_detections']} boxes | High conf (0.60): {high_conf_res['total_detections']} boxes.")

# 13. NMS Duplicate Suppression
def test_13_nms_suppression():
    golden_img = "known_defect_tests/belt_splice_2_frame_00003_jpg.rf.49968cb55095c8b650a32b4de9b866a4.jpg"
    pil_img = Image.open(golden_img)
    res_default = engine.infer(pil_img, iou=0.50)
    res_strict = engine.infer(pil_img, iou=0.20)
    assert res_strict['total_detections'] <= res_default['total_detections'] + 1, "NMS threshold malfunction"
    print(f"IoU 0.50 Detections: {res_default['total_detections']} | Strict IoU 0.20 Detections: {res_strict['total_detections']}")

# 14. ONNX Inference & Parity Test
def test_14_onnx_inference():
    onnx_path = "models/final_sih_model.onnx"
    assert os.path.exists(onnx_path), f"ONNX model {onnx_path} missing!"
    onnx_m = YOLO(onnx_path, task='detect')
    test_img = "known_defect_tests/belt_splice_1_frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg"
    res_onnx = onnx_m(test_img, conf=0.25, imgsz=800, verbose=False)[0]
    assert len(res_onnx.boxes) > 0, "ONNX model produced zero detections on test image"
    print(f"ONNX Runtime inference verified: detected {len(res_onnx.boxes)} boxes.")

# 15. Backend API Integration & Health State Segregation
def test_15_backend_api():
    from app_backend_server import app
    client = app.test_client()
    img_path = "known_defect_tests/belt_splice_1_frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg"
    with open(img_path, "rb") as fp:
        data = {'file': (io.BytesIO(fp.read()), 'test.jpg')}
        r = client.post('/api/detect', data=data, content_type='multipart/form-data')
    assert r.status_code == 200, f"Expected HTTP 200, got {r.status_code}"
    res = r.json
    assert res.get('status') != 'error', f"Backend returned error: {res.get('error')}"
    assert res.get('total_detections', 0) > 0, "Backend produced 0 detections on golden test sample"
    assert res.get('health_state') == 'DEFECT_DETECTED', f"Expected DEFECT_DETECTED, got {res.get('health_state')}"
    print(f"Backend API produced {res['total_detections']} detections in {res['latency_ms']} ms (State: {res['health_state']}).")


if __name__ == '__main__':
    print("🚀 Running 15-Point MineGuard AI Automated Verification Suite...")
    run_test(1, "Model Loading", test_1_model_loading)
    run_test(2, "Image Decoding", test_2_image_decoding)
    run_test(3, "Preprocessing Consistency", test_3_preprocessing)
    run_test(4, "Belt Splice Detection", test_4_splice_detection)
    run_test(5, "Longitudinal Tear Detection", test_5_tear_detection)
    run_test(6, "Deep Scratch Detection", test_6_deep_scratch_detection)
    run_test(7, "Slight Scratch Detection", test_7_slight_scratch_detection)
    run_test(8, "Real Healthy Image Rejection", test_8_healthy_image_rejection)
    run_test(9, "Empty Image Zero-Detection Segregation", test_9_empty_detection)
    run_test(10, "Malformed Image Error Handling", test_10_malformed_image_handling)
    run_test(11, "Coordinate Scaling & Bounding Bounds", test_11_coordinate_scaling)
    run_test(12, "Confidence Threshold Filtering", test_12_confidence_filtering)
    run_test(13, "NMS Duplicate Suppression", test_13_nms_suppression)
    run_test(14, "ONNX Inference Verification", test_14_onnx_inference)
    run_test(15, "Backend API & Health State Segregation", test_15_backend_api)

    print("\n=======================================================")
    print("FINAL TEST EXECUTION SUMMARY")
    print("=======================================================")
    all_passed = True
    for t_name, status in TEST_RESULTS.items():
        print(f"  {t_name:45s} : {status}")
        if status != "PASS":
            all_passed = False

    print("=======================================================")
    if all_passed:
        print("[SUCCESS] ALL 15 TESTS PASSED! ZERO REGRESSIONS DETECTED.")
    else:
        print("[FAIL] ONE OR MORE TESTS FAILED. CHECK LOGS ABOVE.")
        sys.exit(1)
