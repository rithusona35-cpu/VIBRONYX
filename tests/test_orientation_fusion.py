"""
Unit Tests for Orientation-Aware Coordinate Transformations, Geometry Validation, and Smart Router
SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring System
"""

import unittest
import numpy as np
import cv2
import os
import sys

# Ensure workspace root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from orientation_aware_fusion import (
    transform_bbox_to_original,
    validate_detection_geometry,
    compute_iou,
    fuse_orientation_detections,
    SmartOrientationRouter
)
from ultralytics import YOLO

class TestOrientationCoordinateTransformations(unittest.TestCase):
    def setUp(self):
        self.orig_w = 1844
        self.orig_h = 4080

    def test_zero_degree_identity(self):
        """0-degree transformation should be exact identity."""
        box = [100.0, 250.0, 350.0, 800.0]
        res = transform_bbox_to_original(box, 0, self.orig_w, self.orig_h)
        self.assertEqual(res, box)
        self.assertTrue(validate_detection_geometry(res, self.orig_w, self.orig_h))

    def test_90_degree_cw_roundtrip(self):
        """A box in 90-deg CW rotated frame must map to valid original bounds."""
        # In 90-deg CW rotated frame: W_rot = orig_h (4080), H_rot = orig_w (1844)
        box_rot = [500.0, 200.0, 1200.0, 600.0]
        res = transform_bbox_to_original(box_rot, 90, self.orig_w, self.orig_h)
        self.assertTrue(res[0] < res[2], f"x1 ({res[0]}) must be < x2 ({res[2]})")
        self.assertTrue(res[1] < res[3], f"y1 ({res[1]}) must be < y2 ({res[3]})")
        self.assertTrue(0 <= res[0] <= self.orig_w)
        self.assertTrue(0 <= res[2] <= self.orig_w)
        self.assertTrue(0 <= res[1] <= self.orig_h)
        self.assertTrue(0 <= res[3] <= self.orig_h)
        self.assertTrue(validate_detection_geometry(res, self.orig_w, self.orig_h))

    def test_180_degree_roundtrip(self):
        """180-deg transformation must map inverted points back accurately."""
        box_rot = [100.0, 100.0, 400.0, 500.0]
        res = transform_bbox_to_original(box_rot, 180, self.orig_w, self.orig_h)
        self.assertTrue(res[0] < res[2])
        self.assertTrue(res[1] < res[3])
        self.assertTrue(validate_detection_geometry(res, self.orig_w, self.orig_h))

    def test_270_degree_roundtrip(self):
        """270-deg (90 CCW) transformation must map correctly."""
        box_rot = [200.0, 300.0, 600.0, 800.0]
        res = transform_bbox_to_original(box_rot, 270, self.orig_w, self.orig_h)
        self.assertTrue(res[0] < res[2])
        self.assertTrue(res[1] < res[3])
        self.assertTrue(validate_detection_geometry(res, self.orig_w, self.orig_h))

    def test_geometric_point_consistency(self):
        """Verify that a specific physical feature location preserves coordinates across 90-deg CW rotation."""
        # Create a synthetic canvas and place a bright patch
        canvas = np.zeros((self.orig_h, self.orig_w), dtype=np.uint8)
        px1, py1, px2, py2 = 400, 1000, 600, 1500
        canvas[py1:py2, px1:px2] = 255
        
        # Rotate 90 deg CW
        rotated = cv2.rotate(canvas, cv2.ROTATE_90_CLOCKWISE)
        
        # Find non-zero bounds in rotated image
        y_indices, x_indices = np.where(rotated == 255)
        rx1, rx2 = float(np.min(x_indices)), float(np.max(x_indices))
        ry1, ry2 = float(np.min(y_indices)), float(np.max(y_indices))
        
        # Transform back to original
        mapped_box = transform_bbox_to_original([rx1, ry1, rx2, ry2], 90, self.orig_w, self.orig_h)
        
        # Check coordinate accuracy (allow <= 1 px discretization boundary)
        self.assertAlmostEqual(mapped_box[0], float(px1), delta=2.0)
        self.assertAlmostEqual(mapped_box[1], float(py1), delta=2.0)
        self.assertAlmostEqual(mapped_box[2], float(px2 - 1), delta=2.0)
        self.assertAlmostEqual(mapped_box[3], float(py2 - 1), delta=2.0)

    def test_iou_and_fusion(self):
        """Test that overlapping detections in original coordinates fuse cleanly."""
        det1 = {
            "bbox_original": [100.0, 100.0, 300.0, 300.0],
            "class_id": 2,
            "class_name": "longitudinal tear",
            "confidence": 0.85,
            "view_angle": 90
        }
        det2 = {
            "bbox_original": [105.0, 95.0, 310.0, 305.0],
            "class_id": 2,
            "class_name": "longitudinal tear",
            "confidence": 0.65,
            "view_angle": 0
        }
        fused = fuse_orientation_detections([det1, det2], self.orig_w, self.orig_h, iou_thresh=0.45)
        self.assertEqual(len(fused), 1)
        self.assertEqual(fused[0]["confidence"], 0.85)

class TestPhase17FailureRegression(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
        cls.model_path = os.path.join(cls.base_dir, "models", "final_sih_model.pt")
        cls.model = YOLO(cls.model_path)
        cls.router = SmartOrientationRouter(cls.model, imgsz=800, conf=0.05, iou=0.50)
        cls.failing_img_path = os.path.join(cls.base_dir, "tests", "fixtures", "portrait_conveyor_failure.jpg")

    def test_failing_image_recovered_by_smart_router(self):
        """Phase 17 Regression: Portrait conveyor orientation failure MUST be detected via orientation fallback."""
        if not os.path.exists(self.failing_img_path):
            self.skipTest(f"Test image {self.failing_img_path} not found.")
            
        img = cv2.imread(self.failing_img_path)
        self.assertIsNotNone(img, f"Failed to load image from {self.failing_img_path}")
        h, w = img.shape[:2]
        self.assertTrue(h > w, f"Test fixture must be portrait orientation (got {w}x{h})")
        
        # Verify standard inference at conf 0.05 misses (0 detections)
        std_res = self.model.predict(img, imgsz=800, conf=0.05, iou=0.50, verbose=False)[0]
        self.assertEqual(len(std_res.boxes), 0, "Native portrait must reproduce NO_DETECTIONS failure")
        
        # Run smart router
        fused, path_taken, telemetry = self.router.infer(img)
        
        # Verification requirements:
        # 1. Fallback path was activated due to portrait aspect ratio
        self.assertFalse(telemetry["fast_path_used"])
        self.assertIn("PORTRAIT", telemetry["fallback_reason"])
        
        # 2. Defect is recovered (at least 1 detection)
        self.assertGreater(len(fused), 0, "Defect must be recovered via orientation fallback")
        
        # 3. Class must be longitudinal tear
        top_det = fused[0]
        self.assertEqual(top_det["class_name"].lower(), "longitudinal tear")
        
        # 4. Returned bbox must be inside portrait image bounds
        bbox = top_det["bbox_original"]
        self.assertTrue(0 <= bbox[0] < bbox[2] <= w)
        self.assertTrue(0 <= bbox[1] < bbox[3] <= h)
        self.assertTrue(validate_detection_geometry(bbox, w, h))

if __name__ == "__main__":
    unittest.main()
