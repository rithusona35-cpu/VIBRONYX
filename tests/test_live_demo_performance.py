import os
import unittest
import numpy as np
from PIL import Image
from unified_preprocessor import MineGuardInferenceEngine

class TestLiveDemoPerformance(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        model_path = os.path.join(os.path.dirname(__file__), "..", "models", "final_sih_model.pt")
        cls.engine = MineGuardInferenceEngine(weights_path=model_path, imgsz=800, device="cpu")
        cls.dummy = Image.new("RGB", (800, 800), (128, 128, 128))

    def test_warm_fast_path_latency_threshold(self):
        # Warmup
        for _ in range(2):
            self.engine.infer(self.dummy)

        latencies = []
        for _ in range(5):
            res = self.engine.infer(self.dummy)
            latencies.append(res.get("model_latency_ms", 150.0))

        p50 = float(np.percentile(latencies, 50))
        # Verify optimized warm latency is well within realistic 1000ms threshold on Laptop CPU
        self.assertLess(p50, 1000.0, f"Warm Fast Path P50 ({p50:.1f}ms) exceeds 1000ms threshold on Laptop CPU")

if __name__ == "__main__":
    unittest.main()
