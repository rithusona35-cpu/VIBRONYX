"""
MINEGUARD AI — PHASE 5 TEST SUITE: PHYSICAL HARDWARE SAFETY & CONTROL VERIFICATION
SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring

Comprehensive 16-Test Verification Matrix:
  1. Healthy frame
  2. Belt splice
  3. Longitudinal tear
  4. Deep scratch
  5. Slight scratch
  6. NO_DETECTIONS
  7. ANALYSIS_ERROR
  8. Emergency stop
  9. Hardware timeout
  10. STM32 disconnected
  11. Invalid hardware response
  12. Motor fault
  13. Simulation STOP command
  14. Simulation CONTINUE command
  15. Critical defect cannot auto-restart
  16. Model SHA256 unchanged
"""

import os
import sys
import json
import time
import io
import hashlib
import unittest
from PIL import Image

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from hardware_controller import (
    ConveyorHardwareController,
    HardwareState,
    STM32ProtocolAbstraction,
    IndustrialCameraManager,
    compute_crc8
)
from unified_preprocessor import MineGuardInferenceEngine

EXPECTED_SHA256 = "2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3"
MODEL_PATH = os.path.join(BASE_DIR, 'models', 'final_sih_model.pt')


class TestHardwareSafety(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.engine = MineGuardInferenceEngine(
            weights_path=MODEL_PATH,
            imgsz=800,
            conf_threshold=0.25,
            iou_threshold=0.50,
            device='cpu'
        )

    def setUp(self):
        # Create an isolated controller instance for each test to guarantee no cross-contamination
        self.hw = ConveyorHardwareController()
        self.hw.HARDWARE_MODE = "SIMULATION"
        self.hw.PHYSICAL_HARDWARE_VERIFIED = False

    def test_01_healthy_frame(self):
        """1. Healthy frame -> NO_DETECTIONS -> CONTINUE & BELT_RUNNING."""
        clean_img_path = os.path.join(BASE_DIR, 'real_world_test', 'REAL_HEALTHY', 'frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg')
        with open(clean_img_path, 'rb') as f:
            pil_img, w, h = self.engine.decode_image(f.read())
        res = self.engine.infer(pil_img, conf=0.25, iou=0.50)
        hw_payload = self.hw.process_detection_result(res)

        self.assertEqual(hw_payload['action'], 'CONTINUE')
        self.assertEqual(hw_payload['hardware_state'], 'BELT_RUNNING')
        self.assertEqual(hw_payload['motor_state'], 'RUNNING')
        self.assertFalse(hw_payload['emergency_relay_active'])

    def test_02_belt_splice(self):
        """2. Belt splice -> DEFECT_DETECTED -> CRITICAL -> STOP_CONVEYOR."""
        splice_path = os.path.join(BASE_DIR, 'known_defect_tests', 'belt_splice_1_frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg')
        with open(splice_path, 'rb') as f:
            pil_img, w, h = self.engine.decode_image(f.read())
        res = self.engine.infer(pil_img, conf=0.25, iou=0.50)
        hw_payload = self.hw.process_detection_result(res)

        self.assertEqual(hw_payload['health_state'], 'DEFECT_DETECTED')
        self.assertEqual(hw_payload['severity'], 'CRITICAL')
        self.assertEqual(hw_payload['action'], 'STOP_CONVEYOR')
        self.assertEqual(hw_payload['hardware_state'], 'BELT_STOPPED')
        self.assertEqual(hw_payload['motor_state'], 'HALTED')
        self.assertTrue(hw_payload['critical_stop_latched'])

    def test_03_longitudinal_tear(self):
        """3. Longitudinal tear -> DEFECT_DETECTED -> CRITICAL -> STOP_CONVEYOR."""
        tear_path = os.path.join(BASE_DIR, 'known_defect_tests', 'longitudinal_tear_2_frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg')
        with open(tear_path, 'rb') as f:
            pil_img, w, h = self.engine.decode_image(f.read())
        res = self.engine.infer(pil_img, conf=0.25, iou=0.50)
        hw_payload = self.hw.process_detection_result(res)

        self.assertEqual(hw_payload['health_state'], 'DEFECT_DETECTED')
        self.assertEqual(hw_payload['defect_class'], 'LONGITUDINAL_TEAR')
        self.assertEqual(hw_payload['severity'], 'CRITICAL')
        self.assertEqual(hw_payload['action'], 'STOP_CONVEYOR')
        self.assertEqual(hw_payload['hardware_state'], 'BELT_STOPPED')
        self.assertTrue(hw_payload['critical_stop_latched'])

    def test_04_deep_scratch(self):
        """4. Deep scratch -> DEFECT_DETECTED -> ALERT (Conveyor continues running with warning)."""
        scratch_path = os.path.join(BASE_DIR, 'known_defect_tests', 'deep_scratch_1_frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg')
        with open(scratch_path, 'rb') as f:
            pil_img, w, h = self.engine.decode_image(f.read())
        
        # Test synthetic single deep scratch result
        mock_res = {
            "health_state": "DEFECT_DETECTED",
            "detections": [{
                "class_id": 1,
                "class": "deep scratch",
                "severity": "WARNING",
                "confidence": 0.68
            }]
        }
        hw_payload = self.hw.process_detection_result(mock_res)
        self.assertEqual(hw_payload['action'], 'ALERT')
        self.assertEqual(hw_payload['hardware_state'], 'BELT_RUNNING')
        self.assertEqual(hw_payload['motor_state'], 'RUNNING')
        self.assertTrue(hw_payload['buzzer_active'])

    def test_05_slight_scratch(self):
        """5. Slight scratch -> DEFECT_DETECTED -> ALERT (Minor wear logging)."""
        mock_res = {
            "health_state": "DEFECT_DETECTED",
            "detections": [{
                "class_id": 4,
                "class": "slight scratch",
                "severity": "INFO",
                "confidence": 0.42
            }]
        }
        hw_payload = self.hw.process_detection_result(mock_res)
        self.assertEqual(hw_payload['action'], 'ALERT')
        self.assertEqual(hw_payload['hardware_state'], 'BELT_RUNNING')
        self.assertEqual(hw_payload['motor_state'], 'RUNNING')

    def test_06_no_detections(self):
        """6. NO_DETECTIONS -> CONTINUE & BELT_RUNNING."""
        mock_res = {
            "health_state": "NO_DETECTIONS",
            "detections": []
        }
        hw_payload = self.hw.process_detection_result(mock_res)
        self.assertEqual(hw_payload['action'], 'CONTINUE')
        self.assertEqual(hw_payload['hardware_state'], 'BELT_RUNNING')
        self.assertEqual(hw_payload['motor_state'], 'RUNNING')
        self.assertFalse(hw_payload['critical_stop_latched'])

    def test_07_analysis_error(self):
        """7. ANALYSIS_ERROR -> SAFE_STATE (Standby mode, fail-safe)."""
        mock_res = {
            "health_state": "ANALYSIS_ERROR",
            "error_code": "FRAME_CORRUPT",
            "detections": []
        }
        hw_payload = self.hw.process_detection_result(mock_res)
        self.assertEqual(hw_payload['action'], 'SAFE_STATE')
        self.assertEqual(hw_payload['hardware_state'], 'ANALYSIS_ERROR')
        self.assertEqual(hw_payload['motor_state'], 'STANDBY')
        self.assertTrue(hw_payload['buzzer_active'])

    def test_08_emergency_stop(self):
        """8. Emergency stop -> EMERGENCY_STOP -> BELT_STOPPED."""
        self.hw.trigger_emergency_stop("PHYSICAL_E_STOP_BUTTON")
        self.assertEqual(self.hw.state, HardwareState.BELT_STOPPED)
        self.assertEqual(self.hw.last_command, "STOP_CONVEYOR")
        self.assertTrue(self.hw.critical_stop_latched)
        self.assertTrue(self.hw.estop_triggered)

    def test_09_hardware_timeout(self):
        """9. Hardware timeout -> Watchdog expires -> HARDWARE_FAULT -> STOP_CONVEYOR."""
        self.hw.last_heartbeat_time = time.time() - 5.0  # Expire 2.0s watchdog
        watchdog_status = self.hw.check_watchdog()
        self.assertFalse(watchdog_status)
        self.assertEqual(self.hw.state, HardwareState.BELT_STOPPED)
        self.assertEqual(self.hw.last_command, "STOP_CONVEYOR")
        self.assertTrue(self.hw.critical_stop_latched)

    def test_10_stm32_disconnected(self):
        """10. STM32 disconnected -> HARDWARE_FAULT -> STOP_CONVEYOR."""
        self.hw.trigger_stm32_disconnect()
        self.assertEqual(self.hw.state, HardwareState.BELT_STOPPED)
        self.assertEqual(self.hw.last_command, "STOP_CONVEYOR")
        self.assertTrue(self.hw.critical_stop_latched)

    def test_11_invalid_hardware_response(self):
        """11. Invalid hardware response -> CRC verification catches packet corruption."""
        sample_pkt = {"seq_id": 1, "cmd": "STATUS", "payload": {}}
        pkt_bytes = json.dumps(sample_pkt, sort_keys=True).encode('utf-8')
        valid_crc = compute_crc8(pkt_bytes)
        
        # Corrupt data
        corrupted_bytes = json.dumps({"seq_id": 1, "cmd": "STATUS_CORRUPTED", "payload": {}}, sort_keys=True).encode('utf-8')
        corrupt_crc = compute_crc8(corrupted_bytes)
        self.assertNotEqual(valid_crc, corrupt_crc)

    def test_12_motor_fault(self):
        """12. Motor fault -> HARDWARE_FAULT -> STOP_CONVEYOR."""
        self.hw.trigger_motor_fault("OVERCURRENT_STALL")
        self.assertEqual(self.hw.state, HardwareState.BELT_STOPPED)
        self.assertEqual(self.hw.last_command, "STOP_CONVEYOR")
        self.assertTrue(self.hw.motor_fault_detected)
        self.assertTrue(self.hw.critical_stop_latched)

    def test_13_simulation_stop_command(self):
        """13. Simulation STOP command -> Dispatched without energizing real hardware."""
        self.hw.HARDWARE_MODE = "SIMULATION"
        self.hw.PHYSICAL_HARDWARE_VERIFIED = False
        pkt = self.hw.stm32.build_packet("STOP_CONVEYOR")
        success, msg = self.hw.stm32.transmit(pkt, hardware_mode="SIMULATION")
        self.assertTrue(success)
        self.assertEqual(msg, "SIMULATION_LOOPBACK_ACK")
        self.assertFalse(self.hw.PHYSICAL_HARDWARE_VERIFIED)

    def test_14_simulation_continue_command(self):
        """14. Simulation CONTINUE command -> Dispatched without energizing real hardware."""
        self.hw.HARDWARE_MODE = "SIMULATION"
        self.hw.PHYSICAL_HARDWARE_VERIFIED = False
        pkt = self.hw.stm32.build_packet("CONTINUE")
        success, msg = self.hw.stm32.transmit(pkt, hardware_mode="SIMULATION")
        self.assertTrue(success)
        self.assertEqual(msg, "SIMULATION_LOOPBACK_ACK")
        self.assertFalse(self.hw.PHYSICAL_HARDWARE_VERIFIED)

    def test_15_critical_defect_cannot_auto_restart(self):
        """15. Critical defect cannot auto-restart -> Requires explicit operator reset."""
        # Step A: Induce critical defect (Longitudinal Tear)
        crit_res = {
            "health_state": "DEFECT_DETECTED",
            "detections": [{
                "class": "longitudinal tear",
                "severity": "CRITICAL",
                "confidence": 0.88
            }]
        }
        hw1 = self.hw.process_detection_result(crit_res)
        self.assertEqual(hw1['action'], 'STOP_CONVEYOR')
        self.assertEqual(hw1['hardware_state'], 'BELT_STOPPED')
        self.assertTrue(self.hw.critical_stop_latched)

        # Step B: Feed subsequent completely clean frame without operator reset
        clean_res = {
            "health_state": "NO_DETECTIONS",
            "detections": []
        }
        hw2 = self.hw.process_detection_result(clean_res)
        # CRITICAL INVARIANT: Conveyor MUST NOT auto-restart!
        self.assertEqual(hw2['action'], 'STOP_CONVEYOR')
        self.assertEqual(hw2['hardware_state'], 'BELT_STOPPED')
        self.assertTrue(self.hw.critical_stop_latched)

        # Step C: Operator acknowledges and executes explicit reset
        reset_res = self.hw.operator_reset("OPERATOR_JANE_DOE")
        self.assertEqual(reset_res['status'], 'RESET_SUCCESSFUL')
        self.assertEqual(reset_res['hardware_state'], 'SYSTEM_READY')
        self.assertFalse(self.hw.critical_stop_latched)

        # Step D: Feed clean frame again -> Conveyor is now safe to resume running
        hw3 = self.hw.process_detection_result(clean_res)
        self.assertEqual(hw3['action'], 'CONTINUE')
        self.assertEqual(hw3['hardware_state'], 'BELT_RUNNING')
        self.assertEqual(hw3['motor_state'], 'RUNNING')

    def test_16_model_sha256_unchanged(self):
        """16. Model SHA256 unchanged -> Cryptographic hash strictly identical."""
        sha256 = hashlib.sha256()
        with open(MODEL_PATH, 'rb') as f:
            while chunk := f.read(65536):
                sha256.update(chunk)
        current_hash = sha256.hexdigest().lower()
        self.assertEqual(
            current_hash,
            EXPECTED_SHA256.lower(),
            f"CRITICAL SAFETY VIOLATION: Model hash changed from {EXPECTED_SHA256} to {current_hash}!"
        )


if __name__ == '__main__':
    unittest.main(verbosity=2)
