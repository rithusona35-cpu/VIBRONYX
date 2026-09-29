import unittest
from hardware_controller import ConveyorHardwareController, HardwareState

class TestSafetyDemo(unittest.TestCase):
    def setUp(self):
        self.hw = ConveyorHardwareController()

    def test_clean_frame_continue(self):
        payload = self.hw.process_detection_result({"health_state": "NO_DETECTIONS", "detections": []})
        self.assertEqual(payload["action"], "CONTINUE")
        self.assertEqual(self.hw.critical_stop_latched, False)

    def test_critical_defect_stop_and_latch(self):
        payload = self.hw.process_detection_result({
            "health_state": "DEFECT_DETECTED",
            "highest_severity": "CRITICAL",
            "detections": [{"class": "longitudinal tear", "severity": "CRITICAL", "confidence": 0.60}]
        })
        self.assertEqual(payload["action"], "STOP_CONVEYOR")
        self.assertTrue(self.hw.critical_stop_latched)

    def test_clean_frame_after_stop_retains_latch(self):
        # Trigger emergency stop
        self.hw.process_detection_result({
            "health_state": "DEFECT_DETECTED",
            "highest_severity": "CRITICAL",
            "detections": [{"class": "longitudinal tear", "severity": "CRITICAL", "confidence": 0.60}]
        })
        self.assertTrue(self.hw.critical_stop_latched)

        # Feed clean frame
        payload = self.hw.process_detection_result({"health_state": "NO_DETECTIONS", "detections": []})
        # Latch must remain STOP_CONVEYOR
        self.assertEqual(payload["action"], "STOP_CONVEYOR")
        self.assertEqual(payload.get("safety_latch_state"), "CRITICAL_STOP_LATCHED")
        self.assertTrue(self.hw.critical_stop_latched)

    def test_authorized_operator_reset(self):
        # Latched state
        self.hw.critical_stop_latched = True
        reset_res = self.hw.operator_reset(operator_id="CHIEF_OPERATOR")
        self.assertEqual(reset_res["status"], "RESET_SUCCESSFUL")
        self.assertFalse(self.hw.critical_stop_latched)

        # Subsequent clean frame resumes running
        payload = self.hw.process_detection_result({"health_state": "NO_DETECTIONS", "detections": []})
        self.assertEqual(payload["action"], "CONTINUE")

if __name__ == "__main__":
    unittest.main()
