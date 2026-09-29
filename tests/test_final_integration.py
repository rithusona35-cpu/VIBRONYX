"""
MINEGUARD AI — FINAL INTEGRATION TEST SUITE
SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
Author: Senior ML & Embedded Systems Validation Engineer

Tests verified:
1. Production model SHA256 immutability
2. Model loading & 5-class contract
3. 800x800 resolution & conf=0.25 / iou=0.50 compliance
4. DEFECT_DETECTED state & critical alert triggering (Splice / Tear -> STOP_CONVEYOR)
5. NO_DETECTIONS state isolation (Zero false alarms on clean belt -> CONTINUE)
6. ANALYSIS_ERROR fail-safe segregation (Malformed / missing image -> SAFE_STATE)
7. Hardware controller payload schema validation
8. Deterministic 6-step demo sequence verification
9. Web backend API contract and parity
"""

import os
import io
import json
import hashlib
import unittest
from PIL import Image
import numpy as np

from unified_preprocessor import MineGuardInferenceEngine, EXPECTED_CLASSES
from hardware_controller import hardware_bridge
from app_backend_server import app

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
PROD_MODEL_PATH = os.path.join(BASE_DIR, 'models', 'final_sih_model.pt')
LOCKED_SHA256 = "2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3"

class TestFinalIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        # 1. Verify Model File and Checksum
        assert os.path.exists(PROD_MODEL_PATH), f"Production model not found at {PROD_MODEL_PATH}"
        h = hashlib.sha256()
        with open(PROD_MODEL_PATH, 'rb') as f:
            while chunk := f.read(65536):
                h.update(chunk)
        cls.sha256 = h.hexdigest()
        cls.engine = MineGuardInferenceEngine(PROD_MODEL_PATH, imgsz=800, conf_threshold=0.25, iou_threshold=0.50)
        cls.client = app.test_client()

    def test_01_model_immutability(self):
        """Verify model weights SHA256 matches exact locked invariant."""
        self.assertEqual(self.sha256, LOCKED_SHA256, "Production model SHA256 checksum has been altered!")

    def test_02_class_mapping_integrity(self):
        """Verify exact 5 target classes and IDs."""
        self.assertEqual(len(EXPECTED_CLASSES), 5)
        self.assertEqual(EXPECTED_CLASSES[0], 'belt splice')
        self.assertEqual(EXPECTED_CLASSES[1], 'deep scratch')
        self.assertEqual(EXPECTED_CLASSES[2], 'longitudinal tear')
        self.assertEqual(EXPECTED_CLASSES[3], 'normal belt')
        self.assertEqual(EXPECTED_CLASSES[4], 'slight scratch')

    def test_03_inference_configuration(self):
        """Verify imgsz=800, conf=0.25, iou=0.50 contract."""
        self.assertEqual(self.engine.imgsz, 800)
        self.assertEqual(self.engine.conf_threshold, 0.25)
        self.assertEqual(self.engine.iou_threshold, 0.50)

    def test_04_healthy_belt_state_contract(self):
        """Verify healthy clean belt frame produces NO_DETECTIONS and CONTINUE action."""
        healthy_path = os.path.join(BASE_DIR, 'real_world_test', 'REAL_HEALTHY', 'frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg')
        with open(healthy_path, 'rb') as f:
            pil_img, w, h = self.engine.decode_image(f.read())
        res = self.engine.infer(pil_img, conf=0.25, iou=0.50)
        self.assertEqual(res['health_state'], 'NO_DETECTIONS')
        self.assertNotEqual(res['health_state'], 'NORMAL_BELT')
        self.assertEqual(res['total_detections'], 0)
        self.assertEqual(res['hardware_control']['action'], 'CONTINUE')

    def test_05_critical_defect_state_contract(self):
        """Verify longitudinal tear produces DEFECT_DETECTED and STOP_CONVEYOR action."""
        tear_path = os.path.join(BASE_DIR, 'known_defect_tests', 'longitudinal_tear_2_frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg')
        with open(tear_path, 'rb') as f:
            pil_img, w, h = self.engine.decode_image(f.read())
        res = self.engine.infer(pil_img, conf=0.25, iou=0.50)
        self.assertEqual(res['health_state'], 'DEFECT_DETECTED')
        self.assertEqual(res['highest_severity'], 'CRITICAL')
        self.assertEqual(res['hardware_control']['action'], 'STOP_CONVEYOR')
        self.assertEqual(res['hardware_control']['defect_class'], 'LONGITUDINAL_TEAR')

    def test_06_analysis_error_fail_safe(self):
        """Verify malformed image ingestion returns ANALYSIS_ERROR and SAFE_STATE."""
        res = self.client.post('/api/detect', data={'file': (io.BytesIO(b'corrupted_data_not_an_image'), 'test.jpg')})
        data = json.loads(res.data.decode('utf-8'))
        self.assertEqual(data['health_state'], 'ANALYSIS_ERROR')
        self.assertEqual(data['hardware_control']['action'], 'SAFE_STATE')

    def test_07_hardware_controller_bridge(self):
        """Verify hardware controller logical payload schema."""
        status = hardware_bridge.get_hardware_status()
        self.assertIn("subsystem", status)
        self.assertIn("camera_optical_specs", status)
        self.assertEqual(status["camera_optical_specs"]["working_distance_m"], 1.20)
        self.assertEqual(status["camera_optical_specs"]["led_illumination_angle_deg"], 18.0)

    def test_08_demo_manifest_6_steps(self):
        """Verify deterministic 6-step demo manifest exists and has all 6 steps."""
        manifest_path = os.path.join(BASE_DIR, 'demo', 'demo_manifest.json')
        self.assertTrue(os.path.exists(manifest_path))
        with open(manifest_path, 'r', encoding='utf-8') as f:
            manifest = json.load(f)
        steps = manifest.get('demo_sequence', [])
        self.assertEqual(len(steps), 6)
        self.assertEqual(steps[0]['health_state'], 'NO_DETECTIONS')
        self.assertEqual(steps[1]['health_state'], 'DEFECT_DETECTED')
        self.assertEqual(steps[3]['health_state'], 'DEFECT_DETECTED')
        self.assertEqual(steps[5]['health_state'], 'NO_DETECTIONS')

    def test_09_api_demo_step_endpoint(self):
        """Verify /api/demo_step/<id> returns valid inference result and hardware signal."""
        res = self.client.get('/api/demo_step/1')
        self.assertEqual(res.status_code, 200)
        data = json.loads(res.data.decode('utf-8'))
        self.assertEqual(data['health_state'], 'NO_DETECTIONS')
        self.assertEqual(data['hardware_control']['action'], 'CONTINUE')

        res_tear = self.client.get('/api/demo_step/4')
        self.assertEqual(res_tear.status_code, 200)
        data_tear = json.loads(res_tear.data.decode('utf-8'))
        self.assertEqual(data_tear['health_state'], 'DEFECT_DETECTED')
        self.assertEqual(data_tear['hardware_control']['action'], 'STOP_CONVEYOR')

    def test_10_structured_logging(self):
        """Verify structured telemetry log file exists and receives log lines."""
        log_path = os.path.join(BASE_DIR, 'logs', 'mineguard_telemetry.log')
        self.assertTrue(os.path.exists(log_path))
        with open(log_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
        self.assertGreater(len(lines), 0)
        last_log = json.loads(lines[-1])
        self.assertIn("timestamp", last_log)
        self.assertIn("health_state", last_log)
        self.assertIn("model", last_log)
        self.assertIn("inference_latency_ms", last_log)

if __name__ == '__main__':
    unittest.main()
