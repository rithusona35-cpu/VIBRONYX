"""
Benchmark PyTorch CPU Thread Count & Inference Modes.
Measures P50, P95, P99 across thread configurations and torch.inference_mode().
"""

import os
import sys
import time
import numpy as np
import cv2
import torch
from ultralytics import YOLO

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "final_sih_model.pt")
TEST_IMG_PATH = os.path.join(BASE_DIR, "demo_images", "frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg")

def benchmark_threads():
    print(f"PyTorch Version: {torch.__version__}")
    print(f"System CPU count (logical): {os.cpu_count()}")
    print(f"Default torch threads: {torch.get_num_threads()}")

    test_img = cv2.imread(TEST_IMG_PATH)
    model = YOLO(MODEL_PATH)

    # Initial Warmup
    print("Initial model warmup...")
    for _ in range(3):
        _ = model.predict(test_img, imgsz=800, conf=0.25, verbose=False)

    thread_configs = [1, 2, 4, 6, 8, os.cpu_count()]
    results = {}

    print("\n" + "="*70)
    print(f"{'THREADS':<10} | {'MODE':<16} | {'P50 (ms)':<10} | {'P95 (ms)':<10} | {'P99 (ms)':<10}")
    print("="*70)

    for th in thread_configs:
        torch.set_num_threads(th)
        # Test torch.no_grad()
        lats_nograd = []
        for _ in range(7):
            t0 = time.perf_counter()
            with torch.no_grad():
                _ = model.predict(test_img, imgsz=800, conf=0.25, verbose=False)
            lats_nograd.append((time.perf_counter() - t0) * 1000.0)

        p50 = float(np.percentile(lats_nograd, 50))
        p95 = float(np.percentile(lats_nograd, 95))
        p99 = float(np.percentile(lats_nograd, 99))
        print(f"{th:<10} | {'torch.no_grad':<16} | {p50:10.2f} | {p95:10.2f} | {p99:10.2f}")

        # Test torch.inference_mode()
        lats_inf = []
        for _ in range(7):
            t0 = time.perf_counter()
            with torch.inference_mode():
                _ = model.predict(test_img, imgsz=800, conf=0.25, verbose=False)
            lats_inf.append((time.perf_counter() - t0) * 1000.0)

        p50_inf = float(np.percentile(lats_inf, 50))
        p95_inf = float(np.percentile(lats_inf, 95))
        p99_inf = float(np.percentile(lats_inf, 99))
        print(f"{th:<10} | {'inference_mode':<16} | {p50_inf:10.2f} | {p95_inf:10.2f} | {p99_inf:10.2f}")

        results[th] = {
            "p50_nograd": p50,
            "p95_nograd": p95,
            "p50_inf": p50_inf,
            "p95_inf": p95_inf
        }

    print("="*70)
    best_th = min(results.keys(), key=lambda k: results[k]["p50_inf"])
    print(f"\n🏆 Optimal PyTorch Thread Configuration: {best_th} threads (P50: {results[best_th]['p50_inf']:.2f} ms)")

if __name__ == "__main__":
    benchmark_threads()
