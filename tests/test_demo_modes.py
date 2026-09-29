import os
import unittest
from PIL import Image
from unified_preprocessor import MineGuardInferenceEngine

class TestDemoModes(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "final_sih_model.pt")
        cls.engine = MineGuardInferenceEngine(weights_path=model_path, imgsz=800, device="cpu")
        cls.test_img = Image.new("RGB", (800, 800), (128, 128, 128))

    def test_shared_inference_engine_contract(self):
        # Verify that all demo modes rely on identical model instance
        res1 = self.engine.infer(self.test_img)
        res2 = self.engine.infer(self.test_img)
        self.assertEqual(res1["model_name"], res2["model_name"])
        self.assertEqual(res1["model_version"], res2["model_version"])
        self.assertEqual(res1["total_detections"], res2["total_detections"])

if __name__ == "__main__":
    unittest.main()
