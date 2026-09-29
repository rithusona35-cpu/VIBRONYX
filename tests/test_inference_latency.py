import os
import unittest
import time
from PIL import Image
from unified_preprocessor import MineGuardInferenceEngine

class TestInferenceLatency(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "final_sih_model.pt")
        cls.engine = MineGuardInferenceEngine(weights_path=model_path, imgsz=800, device="cpu")
        cls.test_img = Image.new("RGB", (800, 800), (200, 200, 200))

    def test_warmup_speedup_factor(self):
        # Already pre-warmed during __init__()
        t0 = time.perf_counter()
        res = self.engine.infer(self.test_img)
        t_ms = (time.perf_counter() - t0) * 1000.0
        self.assertLess(t_ms, 1000.0)
        self.assertIn("latency_ms", res)

if __name__ == "__main__":
    unittest.main()
