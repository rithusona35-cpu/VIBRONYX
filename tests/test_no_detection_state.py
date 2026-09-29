"""
Unit Test Suite: No-Detection and Analysis-Error State Isolation
Verifies that zero detections strictly output NO_DETECTIONS rather than falsely claiming healthy,
and errors yield ANALYSIS_ERROR.
"""

import os
import sys
import unittest
from PIL import Image

sys.path.insert(0, os.path.abspath("."))
from unified_preprocessor import MineGuardInferenceEngine

class TestNoDetectionState(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        model_path = os.path.abspath("models/final_sih_model.pt")
        cls.engine = MineGuardInferenceEngine(model_path, imgsz=800, device='cpu')

    def test_blank_image_state(self):
        """Zero detection must be classified as NO_DETECTIONS, not HEALTHY."""
        blank = Image.new('RGB', (800, 800), color=(15, 15, 15))
        res = self.engine.infer(blank, conf=0.50)
        self.assertEqual(res['total_detections'], 0)
        self.assertEqual(res['health_state'], 'NO_DETECTIONS')
        self.assertEqual(res['highest_severity'], 'NO_DETECTIONS')
        self.assertIn("NO DEFECT DETECTED ABOVE THRESHOLD", res['status'])
        self.assertNotIn("HEALTHY", res['status'])

    def test_clean_rubber_rejection(self):
        """Clean conveyor rubber should produce no defect detections."""
        p = "real_world_test/REAL_HEALTHY/frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg"
        img = Image.open(p)
        res = self.engine.infer(img, conf=0.25)
        defect_boxes = [b for b in res['detections'] if b['class_id'] in [0, 1, 2, 4]]
        self.assertEqual(len(defect_boxes), 0)

    def test_corrupt_payload_error_handling(self):
        """Corrupt or non-image bytes must raise exception or return ANALYSIS_ERROR."""
        corrupted = b"NON_IMAGE_CORRUPT_BUFFER_XYZ_123"
        with self.assertRaises(Exception):
            self.engine.decode_image(corrupted)

if __name__ == '__main__':
    unittest.main()
