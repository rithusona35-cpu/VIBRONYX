"""
Unit Test Suite: Bounding Box Coordinate Scaling
Validates that YOLO detections are accurately rescaled to original image pixel coordinates
and strictly bounded within [0, orig_w] x [0, orig_h].
"""

import os
import sys
import unittest
from PIL import Image

sys.path.insert(0, os.path.abspath("."))
from unified_preprocessor import MineGuardInferenceEngine

class TestBBoxScaling(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        model_path = os.path.abspath("models/final_sih_model.pt")
        cls.engine = MineGuardInferenceEngine(model_path, imgsz=800, conf_threshold=0.20, device='cpu')

    def test_native_image_bounds(self):
        """Native image coordinate bounds verification."""
        p = "known_defect_tests/deep_scratch_1_frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg"
        img = Image.open(p)
        orig_w, orig_h = img.size
        res = self.engine.infer(img)
        self.assertGreater(len(res['detections']), 0)
        for det in res['detections']:
            x1, y1, x2, y2 = det['bbox']
            self.assertGreaterEqual(x1, 0)
            self.assertGreaterEqual(y1, 0)
            self.assertLessEqual(x2, orig_w)
            self.assertLessEqual(y2, orig_h)
            self.assertLess(x1, x2)
            self.assertLess(y1, y2)

    def test_resized_arbitrary_aspect_ratio(self):
        """Coordinate scaling on non-square, non-800px input images."""
        p = "known_defect_tests/belt_splice_1_frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg"
        img = Image.open(p).resize((1280, 720))
        res = self.engine.infer(img)
        self.assertEqual(res['image_width'], 1280)
        self.assertEqual(res['image_height'], 720)
        self.assertGreater(len(res['detections']), 0)
        for det in res['detections']:
            x1, y1, x2, y2 = det['bbox']
            self.assertTrue(0 <= x1 < x2 <= 1280, f"X coordinates out of bounds: {x1}, {x2}")
            self.assertTrue(0 <= y1 < y2 <= 720, f"Y coordinates out of bounds: {y1}, {y2}")

if __name__ == '__main__':
    unittest.main()
