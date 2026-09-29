"""
Unit Test Suite: Threshold Calibration & Filtering Behavior
Validates confidence sweeps, monotonicity, and Mode A vs Mode B behavior.
"""

import os
import sys
import unittest
from PIL import Image

sys.path.insert(0, os.path.abspath("."))
from unified_preprocessor import MineGuardInferenceEngine

class TestThresholdBehavior(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        model_path = os.path.abspath("models/final_sih_model.pt")
        cls.engine = MineGuardInferenceEngine(model_path, imgsz=800, device='cpu')
        cls.test_image_path = "known_defect_tests/deep_scratch_1_frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg"
        cls.pil_img = Image.open(cls.test_image_path)

    def test_monotonic_detection_reduction(self):
        """Higher confidence thresholds must never increase detection count."""
        thresholds = [0.10, 0.20, 0.30, 0.40, 0.50, 0.60, 0.70]
        counts = []
        for th in thresholds:
            res = self.engine.infer(self.pil_img, conf=th)
            counts.append(res['total_detections'])
            
        for i in range(len(counts) - 1):
            self.assertGreaterEqual(
                counts[i], counts[i+1],
                f"Threshold anomaly: {thresholds[i]} produced {counts[i]} < {thresholds[i+1]} producing {counts[i+1]}"
            )

    def test_mode_a_defect_sensitivity(self):
        """Mode A (conf=0.25) must capture critical defect bounding boxes."""
        res_a = self.engine.infer(self.pil_img, conf=0.25)
        self.assertGreaterEqual(res_a['total_detections'], 1)
        classes = [d['class_id'] for d in res_a['detections']]
        self.assertIn(1, classes, "Mode A must detect Deep Scratch on test frame")

    def test_mode_b_conservative_filtering(self):
        """Mode B (conf=0.40) must have fewer or equal detections compared to Mode A."""
        res_a = self.engine.infer(self.pil_img, conf=0.25)
        res_b = self.engine.infer(self.pil_img, conf=0.40)
        self.assertLessEqual(res_b['total_detections'], res_a['total_detections'])
        for det in res_b['detections']:
            self.assertGreaterEqual(det['confidence'], 0.40)

if __name__ == '__main__':
    unittest.main()
