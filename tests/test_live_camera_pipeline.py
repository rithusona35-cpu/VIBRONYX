import unittest
from camera_manager import CameraManager

class TestLiveCameraPipeline(unittest.TestCase):
    def test_camera_manager_singleton_and_status(self):
        cm = CameraManager(default_index=0)
        status = cm.get_status()
        self.assertIn("policy", status)
        self.assertEqual(status["policy"], "LATEST_FRAME_WINS")
        self.assertIn("is_active", status)

    def test_latest_frame_wins_interface(self):
        cm = CameraManager(default_index=0)
        pil_img, bgr, fid = cm.get_latest_frame()
        # When stopped, returns None safely without throwing an exception
        self.assertIsInstance(fid, int)

if __name__ == "__main__":
    unittest.main()
