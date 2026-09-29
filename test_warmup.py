"""
Warmup Benchmark Test for MineGuard AI Production Model.
Measures cold start vs sequential warm inferences.
"""

import os
import sys
import time
import csv
import numpy as np
import cv2
import torch
from ultralytics import YOLO

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "final_sih_model.pt")
TEST_IMG = os.path.join(BASE_DIR, "demo_images", "frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg")

def benchmark_warmup():
    print("Measuring cold vs warm inference times...")
    img = cv2.imread(TEST_IMG)

    # 1. Model Loading
    t_load_0 = time.perf_counter()
    model = YOLO(MODEL_PATH)
    t_load_ms = (time.perf_counter() - t_load_0) * 1000.0
    print(f"Model File Load Latency: {t_load_ms:.2f} ms")

    # 2. Cold Start Inference
    t0 = time.perf_counter()
    with torch.inference_mode():
        _ = model.predict(img, imgsz=800, conf=0.25, verbose=False)
    cold_start_ms = (time.perf_counter() - t0) * 1000.0
    print(f"Cold Start Inference: {cold_start_ms:.2f} ms")

    # 3. Warm Inferences 1 through 10
    warm_results = []
    warm_results.append(("cold_start", cold_start_ms))

    for i in range(1, 11):
        t0 = time.perf_counter()
        with torch.inference_mode():
            _ = model.predict(img, imgsz=800, conf=0.25, verbose=False)
        lat_ms = (time.perf_counter() - t0) * 1000.0
        warm_results.append((f"warm_inference_{i}", lat_ms))
        print(f"Warm Inference #{i:2d}: {lat_ms:.2f} ms")

    # Save to CSV
    csv_path = os.path.join(BASE_DIR, "reports", "WARMUP_BENCHMARK.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["inference_run", "latency_ms"])
        for run_name, lat in warm_results:
            writer.writerow([run_name, round(lat, 2)])

    print(f"\nSaved Warmup Benchmark to {csv_path}")

    # Summary
    warm_only = [lat for name, lat in warm_results if "warm" in name]
    print(f"Cold Start: {cold_start_ms:.2f} ms")
    print(f"Mean Warm Inference: {np.mean(warm_only):.2f} ms")
    print(f"Speedup from Warmup: {cold_start_ms / np.mean(warm_only):.2f}x")

if __name__ == "__main__":
    benchmark_warmup()
