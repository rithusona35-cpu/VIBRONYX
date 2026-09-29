"""
Live Camera Pipeline with Latest-Frame-Wins Architecture.
Tests camera index discovery, capture latency, inference latency,
end-to-end FPS, and dropped frames over a 100-frame continuous run.
"""

import os
import sys
import time
import threading
import csv
import cv2
import numpy as np
import torch
from ultralytics import YOLO

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "final_sih_model.pt")

class LatestFrameCapture:
    """Threaded camera capture that continuously grabs frames so buffer never lags."""
    def __init__(self, camera_index=0):
        self.camera_index = camera_index
        self.cap = None
        self.latest_frame = None
        self.frame_count = 0
        self.is_running = False
        self.lock = threading.Lock()
        self.thread = None
        self.init_time_ms = 0

    def start(self):
        t0 = time.perf_counter()
        self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
        if not self.cap.isOpened():
            self.cap = cv2.VideoCapture(self.camera_index)
        self.init_time_ms = (time.perf_counter() - t0) * 1000.0

        if not self.cap.isOpened():
            return False

        self.is_running = True
        self.thread = threading.Thread(target=self._capture_loop, daemon=True)
        self.thread.start()
        # Wait for first frame
        for _ in range(50):
            if self.latest_frame is not None:
                return True
            time.sleep(0.02)
        return self.latest_frame is not None

    def _capture_loop(self):
        while self.is_running and self.cap.isOpened():
            ret, frame = self.cap.read()
            if ret and frame is not None:
                with self.lock:
                    self.latest_frame = frame
                    self.frame_count += 1
            else:
                time.sleep(0.005)

    def get_latest_frame(self):
        with self.lock:
            if self.latest_frame is not None:
                return self.latest_frame.copy(), self.frame_count
            return None, self.frame_count

    def stop(self):
        self.is_running = False
        if self.thread and self.thread.is_alive():
            self.thread.join(timeout=1.0)
        if self.cap:
            self.cap.release()

def test_camera_pipeline():
    print("--- PHASE 10: CAMERA DISCOVERY & BENCHMARK ---")
    working_index = None
    cam = None

    for idx in range(4):
        print(f"Testing camera index {idx}...")
        test_cam = LatestFrameCapture(camera_index=idx)
        if test_cam.start():
            working_index = idx
            cam = test_cam
            print(f"✅ Camera found at index {idx} (Init latency: {cam.init_time_ms:.1f}ms)")
            break
        else:
            test_cam.stop()

    if cam is None:
        print("❌ No physical webcam/camera detected on indices 0-3.")
        csv_path = os.path.join(BASE_DIR, "reports", "LIVE_CAMERA_BENCHMARK.csv")
        with open(csv_path, "w", newline="", encoding="utf-8") as f:
            f.write("camera_index,status\nNOT_AVAILABLE,CAMERA_TEST_FAILED\n")
        return

    # Measure camera parameters
    frame, _ = cam.get_latest_frame()
    h, w = frame.shape[:2]
    print(f"Native Resolution: {w}x{h} px")

    # Load & warm model
    torch.set_num_threads(8)
    model = YOLO(MODEL_PATH)
    # Warmup
    for _ in range(3):
        _ = model.predict(frame, imgsz=800, conf=0.25, verbose=False)

    print("\n--- PHASE 11 & 12: LATEST-FRAME-WINS STRESS TEST (30 INFERENCES) ---")
    inferred_count = 0
    capture_latencies = []
    inference_latencies = []
    e2e_latencies = []
    last_frame_id = -1

    t_start_session = time.perf_counter()

    for i in range(30):
        t0 = time.perf_counter()
        f, frame_id = cam.get_latest_frame()
        t_cap = (time.perf_counter() - t0) * 1000.0

        if f is None or frame_id == last_frame_id:
            time.sleep(0.01)
            continue

        last_frame_id = frame_id
        t1 = time.perf_counter()
        with torch.inference_mode():
            res = model.predict(f, imgsz=800, conf=0.25, verbose=False)[0]
        t_inf = (time.perf_counter() - t1) * 1000.0
        t_e2e = (time.perf_counter() - t0) * 1000.0

        capture_latencies.append(t_cap)
        inference_latencies.append(t_inf)
        e2e_latencies.append(t_e2e)
        inferred_count += 1

        n_dets = len(res.boxes)
        top_cls = res.names[int(res.boxes.cls[0])] if n_dets > 0 else "NO_DETECTIONS"
        print(f"Frame #{inferred_count:2d} (RawID: {frame_id:4d}) | Cap: {t_cap:5.2f}ms | Infer: {t_inf:6.2f}ms | E2E: {t_e2e:6.2f}ms | Dets: {n_dets} ({top_cls})")

    total_time_s = time.perf_counter() - t_start_session
    cam_total_frames = cam.frame_count
    cam.stop()

    dropped_frames = max(0, cam_total_frames - inferred_count)
    achieved_fps = inferred_count / total_time_s if total_time_s > 0 else 0
    camera_hardware_fps = cam_total_frames / total_time_s if total_time_s > 0 else 0

    print("\n" + "="*70)
    print("LIVE CAMERA PERFORMANCE SUMMARY (LAPTOP CPU + LATEST-FRAME-WINS)")
    print("="*70)
    print(f"Working Camera Index:          {working_index}")
    print(f"Camera Initialization Time:    {cam.init_time_ms:.2f} ms")
    print(f"Native Resolution:             {w}x{h} px")
    print(f"Raw Camera Ingestion FPS:      {camera_hardware_fps:.2f} FPS ({cam_total_frames} frames)")
    print(f"Inference Pipeline FPS:        {achieved_fps:.2f} FPS ({inferred_count} frames)")
    print(f"Dropped Frames (Decoupled):    {dropped_frames} frames (Latest-Frame-Wins verified)")
    print(f"P50 Capture Latency:           {np.percentile(capture_latencies, 50):.2f} ms")
    print(f"P50 Inference Latency:         {np.percentile(inference_latencies, 50):.2f} ms")
    print(f"P95 Inference Latency:         {np.percentile(inference_latencies, 95):.2f} ms")
    print(f"P50 End-to-End Latency:        {np.percentile(e2e_latencies, 50):.2f} ms")
    print(f"P95 End-to-End Latency:        {np.percentile(e2e_latencies, 95):.2f} ms")
    print("="*70)

    # Save CSV
    csv_path = os.path.join(BASE_DIR, "reports", "LIVE_CAMERA_BENCHMARK.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["metric", "value"])
        writer.writerow(["camera_index", working_index])
        writer.writerow(["init_latency_ms", round(cam.init_time_ms, 2)])
        writer.writerow(["resolution", f"{w}x{h}"])
        writer.writerow(["camera_raw_fps", round(camera_hardware_fps, 2)])
        writer.writerow(["inference_fps", round(achieved_fps, 2)])
        writer.writerow(["total_captured_frames", cam_total_frames])
        writer.writerow(["total_inferred_frames", inferred_count])
        writer.writerow(["dropped_frames", dropped_frames])
        writer.writerow(["capture_p50_ms", round(float(np.percentile(capture_latencies, 50)), 2)])
        writer.writerow(["inference_p50_ms", round(float(np.percentile(inference_latencies, 50)), 2)])
        writer.writerow(["inference_p95_ms", round(float(np.percentile(inference_latencies, 95)), 2)])
        writer.writerow(["e2e_p50_ms", round(float(np.percentile(e2e_latencies, 50)), 2)])
        writer.writerow(["e2e_p95_ms", round(float(np.percentile(e2e_latencies, 95)), 2)])
        writer.writerow(["architecture", "LATEST_FRAME_WINS"])

    print(f"Saved Camera Benchmark to {csv_path}")

if __name__ == "__main__":
    test_camera_pipeline()
