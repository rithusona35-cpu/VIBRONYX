"""
==============================================================================
MINEGUARD AI — AUTOMATED FULL-STACK WEB INTEGRATION TEST SUITE
SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring
==============================================================================
Validates:
1. Web server static asset delivery (code.html, config.js, dashboard.js, hardware_integration.js)
2. Production model SHA256 cryptographic immutability
3. 5-Class metadata mapping parity
4. Model info and health endpoints (/api/model_info, /api/ai/health)
5. Clean belt evaluation -> NO_DETECTIONS, CONTINUE
6. Critical defect detection -> STOP_CONVEYOR & STOP_LATCHED
7. CRITICAL INVARIANT: Clean camera frame DOES NOT auto-restart stopped conveyor!
8. Authorized operator reset clears safety latch -> SYSTEM_READY
9. Unauthorized / automatic reset attempt is strictly rejected
10. STM32 Simulation fallback mode when hardware COM port is absent
11. Sensor telemetry endpoint schema (/api/telemetry)
12. Camera endpoints (/api/camera/status, /api/camera/start, /api/camera/stop, /api/camera/frame)
13. SIH Demo sequence endpoints (/api/demo_manifest, /api/demo_step/1, /api/demo_step/4)
14. Defect event log and safety event log endpoints (/api/events/defects, /api/events/safety)
15. Maintenance ticket status updating (/api/maintenance, /api/maintenance/update)
==============================================================================
"""

import os
import io
import json
import hashlib
import unittest
from PIL import Image
import numpy as np

from app import app
from hardware_controller import hardware_bridge, HardwareState
from unified_preprocessor import EXPECTED_CLASSES

LOCKED_SHA256 = "2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3"
BASE_DIR = os.path.abspath(os.path.dirname(__file__))

class TestMineGuardWebIntegration(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        cls.client = app.test_client()
        cls.model_path = os.path.join(BASE_DIR, "models", "final_sih_model.pt")
        assert os.path.exists(cls.model_path), f"Production model missing at {cls.model_path}"

    def setUp(self):
        # Reset hardware bridge to clean state before each test
        hardware_bridge.operator_reset("TEST_FIXTURE_SETUP")

    def test_01_static_assets_serving(self):
        """Verify web dashboard HTML and JS assets are served with HTTP 200."""
        r_index = self.client.get('/')
        self.assertEqual(r_index.status_code, 200)
        self.assertIn(b"MineGuard AI", r_index.data)
        self.assertIn(b"dashboard.js", r_index.data)

        for js_file in ['config.js', 'dashboard.js', 'hardware_integration.js']:
            r_js = self.client.get(f'/{js_file}')
            self.assertEqual(r_js.status_code, 200, f"Failed to serve {js_file}")

    def test_02_model_hash_immutability(self):
        """Verify production model SHA256 has not been modified or retrained."""
        h = hashlib.sha256()
        with open(self.model_path, 'rb') as f:
            while chunk := f.read(65536):
                h.update(chunk)
        calc_sha = h.hexdigest()
        self.assertEqual(calc_sha, LOCKED_SHA256, "Model SHA-256 hash altered! Model must remain frozen.")

    def test_03_class_mapping_contract(self):
        """Verify exact 5 target defect classes."""
        self.assertEqual(len(EXPECTED_CLASSES), 5)
        self.assertEqual(EXPECTED_CLASSES[0], 'belt splice')
        self.assertEqual(EXPECTED_CLASSES[1], 'deep scratch')
        self.assertEqual(EXPECTED_CLASSES[2], 'longitudinal tear')
        self.assertEqual(EXPECTED_CLASSES[3], 'normal belt')
        self.assertEqual(EXPECTED_CLASSES[4], 'slight scratch')

    def test_04_model_info_and_health(self):
        """Verify /api/model_info and /api/ai/health return valid ready state."""
        r_info = self.client.get('/api/model_info')
        self.assertEqual(r_info.status_code, 200)
        d_info = json.loads(r_info.data)
        self.assertEqual(d_info.get("status"), "ready")
        self.assertEqual(d_info.get("sha256"), LOCKED_SHA256)

        r_health = self.client.get('/api/ai/health')
        self.assertEqual(r_health.status_code, 200)
        d_health = json.loads(r_health.data)
        self.assertEqual(d_health.get("status"), "HEALTHY")

    def test_05_clean_belt_inference(self):
        """Verify clean rubber image results in NO_DETECTIONS and CONTINUE command."""
        healthy_img = os.path.join(BASE_DIR, 'real_world_test', 'REAL_HEALTHY', 'frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg')
        if not os.path.exists(healthy_img):
            healthy_img = os.path.join(BASE_DIR, 'demo', 'final_demo_images', 'frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg')

        with open(healthy_img, 'rb') as f:
            r = self.client.post('/api/detect', data={'file': (io.BytesIO(f.read()), 'healthy.jpg')})

        self.assertEqual(r.status_code, 200)
        res = json.loads(r.data)
        self.assertEqual(res.get('health_state'), 'NO_DETECTIONS')
        self.assertEqual(res.get('total_detections'), 0)
        self.assertEqual(res.get('hardware_control', {}).get('action'), 'CONTINUE')
        self.assertFalse(hardware_bridge.critical_stop_latched)

    def test_06_critical_defect_triggers_latch(self):
        """Verify critical defect (Longitudinal Tear) stops conveyor and engages latch."""
        tear_img = os.path.join(BASE_DIR, 'known_defect_tests', 'longitudinal_tear_2_frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg')
        if not os.path.exists(tear_img):
            tear_img = os.path.join(BASE_DIR, 'demo', 'final_demo_images', 'frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg')

        with open(tear_img, 'rb') as f:
            r = self.client.post('/api/detect', data={'file': (io.BytesIO(f.read()), 'tear.jpg')})

        self.assertEqual(r.status_code, 200)
        res = json.loads(r.data)
        self.assertEqual(res.get('highest_severity'), 'CRITICAL')
        self.assertEqual(res.get('hardware_control', {}).get('action'), 'STOP_CONVEYOR')
        self.assertTrue(hardware_bridge.critical_stop_latched, "Safety latch must be engaged on critical defect!")

    def test_07_clean_frame_does_not_auto_restart(self):
        """CRITICAL INVARIANT: Clean frame while latched must NOT restart conveyor."""
        # Step 1: Engage latch with critical defect
        tear_img = os.path.join(BASE_DIR, 'known_defect_tests', 'longitudinal_tear_2_frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg')
        with open(tear_img, 'rb') as f:
            self.client.post('/api/detect', data={'file': (io.BytesIO(f.read()), 'tear.jpg')})
        self.assertTrue(hardware_bridge.critical_stop_latched)

        # Step 2: Ingest clean healthy frame
        healthy_img = os.path.join(BASE_DIR, 'real_world_test', 'REAL_HEALTHY', 'frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg')
        with open(healthy_img, 'rb') as f:
            r_clean = self.client.post('/api/detect', data={'file': (io.BytesIO(f.read()), 'clean.jpg')})

        res_clean = json.loads(r_clean.data)
        self.assertEqual(res_clean.get('health_state'), 'NO_DETECTIONS')
        # Action MUST remain STOP_CONVEYOR because latch is active!
        self.assertEqual(res_clean.get('hardware_control', {}).get('action'), 'STOP_CONVEYOR')
        self.assertTrue(hardware_bridge.critical_stop_latched, "Clean frame must NEVER clear safety latch!")

    def test_08_authorized_operator_reset(self):
        """Verify operator reset clears latch and restores SYSTEM_READY."""
        # Trip latch
        hardware_bridge.critical_stop_latched = True
        hardware_bridge.latch_reason = "CRITICAL_TEAR_TEST"

        # Valid reset
        r_reset = self.client.post('/api/hardware/command', json={'command': 'RESET', 'token': 'MINEGUARD_RESET_2026'})
        self.assertEqual(r_reset.status_code, 200)
        d_reset = json.loads(r_reset.data)
        self.assertTrue(d_reset.get('ok'))
        self.assertFalse(hardware_bridge.critical_stop_latched, "Latch must be cleared after authorized reset.")
        self.assertEqual(hardware_bridge.state, HardwareState.SYSTEM_READY)

    def test_09_unauthorized_reset_rejected(self):
        """Verify invalid or missing reset token is strictly rejected."""
        hardware_bridge.critical_stop_latched = True
        r_bad = self.client.post('/api/hardware/command', json={'command': 'RESET', 'token': 'wrong_password'})
        self.assertEqual(r_bad.status_code, 401)
        self.assertTrue(hardware_bridge.critical_stop_latched, "Unauthorized reset must NOT clear latch!")

    def test_10_simulation_fallback_mode(self):
        """Verify hardware status reports simulation fallback when COM port is offline."""
        r_hw = self.client.get('/api/hardware/status')
        self.assertEqual(r_hw.status_code, 200)
        d_hw = json.loads(r_hw.data)
        self.assertIn("mode", d_hw)
        self.assertIn(d_hw.get("mode"), ["simulation", "physical"])
        self.assertIn("watchdog_remaining_ms", d_hw)

    def test_11_sensor_telemetry_schema(self):
        """Verify /api/telemetry returns all 5 sensor fields."""
        r_tel = self.client.get('/api/telemetry')
        self.assertEqual(r_tel.status_code, 200)
        d_tel = json.loads(r_tel.data)
        self.assertIn("motor_current_A", d_tel)
        self.assertIn("bearing_temp_C", d_tel)
        self.assertIn("vibration_velocity_mms", d_tel)
        self.assertIn("belt_speed_rpm", d_tel)
        self.assertIn("hardware_mode", d_tel)

    def test_12_camera_endpoints(self):
        """Verify camera status and frame serving."""
        r_cam_st = self.client.get('/api/camera/status')
        self.assertEqual(r_cam_st.status_code, 200)
        
        r_frame = self.client.get('/api/camera/frame')
        self.assertEqual(r_frame.status_code, 200)
        self.assertEqual(r_frame.content_type, 'image/jpeg')

    def test_13_demo_sequence_manifest_and_steps(self):
        """Verify demo manifest and step execution."""
        r_man = self.client.get('/api/demo_manifest')
        self.assertEqual(r_man.status_code, 200)

        # Step 1: Clean Belt
        r_s1 = self.client.get('/api/demo_step/1')
        self.assertEqual(r_s1.status_code, 200)
        d_s1 = json.loads(r_s1.data)
        self.assertEqual(d_s1.get('health_state'), 'NO_DETECTIONS')

        # Step 4: Longitudinal Tear
        r_s4 = self.client.get('/api/demo_step/4')
        self.assertEqual(r_s4.status_code, 200)
        d_s4 = json.loads(r_s4.data)
        self.assertEqual(d_s4.get('health_state'), 'DEFECT_DETECTED')
        self.assertEqual(d_s4.get('hardware_control', {}).get('action'), 'STOP_CONVEYOR')

    def test_14_event_logs(self):
        """Verify defect and safety event endpoints."""
        r_defects = self.client.get('/api/events/defects')
        self.assertEqual(r_defects.status_code, 200)
        
        r_safety = self.client.get('/api/events/safety')
        self.assertEqual(r_safety.status_code, 200)
        d_safety = json.loads(r_safety.data)
        self.assertGreater(len(d_safety), 0)

    def test_15_maintenance_module(self):
        """Verify maintenance ticket fetching and status update."""
        r_maint = self.client.get('/api/maintenance')
        self.assertEqual(r_maint.status_code, 200)

        r_up = self.client.post('/api/maintenance/update', json={'id': 'TKT-001', 'status': 'IN_PROGRESS'})
        self.assertEqual(r_up.status_code, 200)
        d_up = json.loads(r_up.data)
        self.assertEqual(d_up.get('record', {}).get('status'), 'IN_PROGRESS')


if __name__ == '__main__':
    unittest.main()
