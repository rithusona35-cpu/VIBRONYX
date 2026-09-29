"""
Unit Test Suite: Model Output Contract Verification
Validates Phase 13 Output Contract across multiple test image types:
1. clean image
2. splice
3. longitudinal tear
4. deep scratch
5. slight scratch
6. malformed image
7. oversized image
8. very dark image
9. very bright image
10. image with no detection
"""

import os
import sys
import unittest
from PIL import Image
import numpy as np

sys.path.insert(0, os.path.abspath("."))
from unified_preprocessor import MineGuardInferenceEngine

class TestModelContract(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        model_path = os.path.abspath("models/final_sih_model.pt")
        cls.engine = MineGuardInferenceEngine(model_path, imgsz=800, conf_threshold=0.25, iou_threshold=0.50, device='cpu')
        
    def _assert_contract_keys(self, res, expected_orig_dim=None):
        required_root_keys = [
            'model_name', 'model_version', 'timestamp', 'image_id',
            'image_width', 'image_height', 'input_size',
            'confidence_threshold', 'iou_threshold', 'detections',
            'processing_time_ms', 'status', 'health_state', 'recommended_action'
        ]
        for k in required_root_keys:
            self.assertIn(k, res, f"Missing root contract key: '{k}'")
            
        if expected_orig_dim:
            self.assertEqual(res['image_width'], expected_orig_dim[0])
            self.assertEqual(res['image_height'], expected_orig_dim[1])
            
        for det in res['detections']:
            required_det_keys = ['class_id', 'class_name', 'confidence', 'bbox', 'severity', 'recommended_action']
            for dk in required_det_keys:
                self.assertIn(dk, det, f"Missing detection key: '{dk}'")
            self.assertEqual(len(det['bbox']), 4)
            self.assertIsInstance(det['class_id'], int)
            self.assertIsInstance(det['confidence'], float)

    # 1. Clean image
    def test_1_clean_image(self):
        clean_path = "real_world_test/REAL_HEALTHY/frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg"
        img = Image.open(clean_path)
        res = self.engine.infer(img)
        self._assert_contract_keys(res, img.size)
        defect_dets = [d for d in res['detections'] if d['class_id'] in [0, 1, 2, 4]]
        self.assertEqual(len(defect_dets), 0, "Clean belt must have 0 defect detections")

    # 2. Belt Splice
    def test_2_splice_image(self):
        p = "known_defect_tests/belt_splice_1_frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg"
        img = Image.open(p)
        res = self.engine.infer(img)
        self._assert_contract_keys(res, img.size)
        classes = [d['class_id'] for d in res['detections']]
        self.assertIn(0, classes, "Belt Splice (class 0) must be detected")
        self.assertEqual(res['health_state'], 'DEFECT_DETECTED')

    # 3. Longitudinal Tear
    def test_3_tear_image(self):
        p = "known_defect_tests/longitudinal_tear_2_frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg"
        img = Image.open(p)
        res = self.engine.infer(img)
        self._assert_contract_keys(res, img.size)
        classes = [d['class_id'] for d in res['detections']]
        self.assertIn(2, classes, "Longitudinal Tear (class 2) must be detected")
        self.assertEqual(res['health_state'], 'DEFECT_DETECTED')

    # 4. Deep Scratch
    def test_4_deep_scratch_image(self):
        p = "known_defect_tests/deep_scratch_1_frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg"
        img = Image.open(p)
        res = self.engine.infer(img)
        self._assert_contract_keys(res, img.size)
        classes = [d['class_id'] for d in res['detections']]
        self.assertIn(1, classes, "Deep Scratch (class 1) must be detected")
        self.assertEqual(res['health_state'], 'DEFECT_DETECTED')

    # 5. Slight Scratch
    def test_5_slight_scratch_image(self):
        p = "known_defect_tests/slight_scratch_5_frame_00129_jpg.rf.7719d1d835cab947ea466cdf7469001a.jpg"
        img = Image.open(p)
        res = self.engine.infer(img)
        self._assert_contract_keys(res, img.size)
        classes = [d['class_id'] for d in res['detections']]
        self.assertIn(4, classes, "Slight Scratch (class 4) must be detected")

    # 6. Malformed Image
    def test_6_malformed_image(self):
        corrupted_bytes = b"CORRUPTED_NON_IMAGE_DATA_BYTES"
        with self.assertRaises(Exception):
            self.engine.decode_image(corrupted_bytes)

    # 7. Oversized Image
    def test_7_oversized_image(self):
        oversized = Image.new('RGB', (2400, 1800), color=(40, 40, 40))
        res = self.engine.infer(oversized)
        self._assert_contract_keys(res, (2400, 1800))
        self.assertEqual(res['image_width'], 2400)
        self.assertEqual(res['image_height'], 1800)

    # 8. Very Dark Image
    def test_8_very_dark_image(self):
        dark_img = Image.new('RGB', (800, 800), color=(5, 5, 5))
        res = self.engine.infer(dark_img)
        self._assert_contract_keys(res, (800, 800))

    # 9. Very Bright Image
    def test_9_very_bright_image(self):
        bright_img = Image.new('RGB', (800, 800), color=(250, 250, 250))
        res = self.engine.infer(bright_img)
        self._assert_contract_keys(res, (800, 800))

    # 10. Image with No Detection
    def test_10_no_detection_image(self):
        blank = Image.new('RGB', (800, 800), color=(30, 30, 30))
        res = self.engine.infer(blank, conf=0.70)
        self._assert_contract_keys(res, (800, 800))
        self.assertEqual(res['total_detections'], 0)
        self.assertEqual(res['health_state'], 'NO_DETECTIONS')
        self.assertIn("NO DEFECT DETECTED ABOVE THRESHOLD", res['status'])

if __name__ == '__main__':
    unittest.main()
