"""
MINEGUARD AI — THREADED LIVE CAMERA CAPTURE MANAGER
Encapsulates non-blocking video capture with Latest-Frame-Wins policy.
Ensures UI and inference engine never lag behind real-world conveyor motion.
"""

import os
import time
import threading
from typing import Optional, Tuple, Dict, Any
import cv2
import numpy as np
from PIL import Image

class CameraManager:
    _instance = None
    _lock = threading.Lock()

    def __new__(cls, *args, **kwargs):
        with cls._lock:
            if cls._instance is None:
                cls._instance = super(CameraManager, cls).__new__(cls)
                cls._instance._initialized = False
            return cls._instance

    def __init__(self, default_index: int = 0):
        if self._initialized:
            return
        self.camera_index = default_index
        self.cap: Optional[cv2.VideoCapture] = None
        self.latest_frame: Optional[np.ndarray] = None
        self.frame_counter = 0
        self.dropped_counter = 0
        self.is_running = False
        self.capture_thread: Optional[threading.Thread] = None
        self.frame_lock = threading.Lock()
        self.last_capture_time = 0.0
        self.fps_estimate = 0.0
        self.init_time_ms = 0.0
        self._initialized = True

    def start(self, index: Optional[int] = None) -> bool:
        """Starts background frame ingestion worker thread."""
        with self.frame_lock:
            if self.is_running and self.cap and self.cap.isOpened():
                return True

            if index is not None:
                self.camera_index = index

            t0 = time.perf_counter()
            # Try DirectShow on Windows for fastest device enumeration
            self.cap = cv2.VideoCapture(self.camera_index, cv2.CAP_DSHOW)
            if not self.cap.isOpened():
                self.cap = cv2.VideoCapture(self.camera_index)

            self.init_time_ms = (time.perf_counter() - t0) * 1000.0
            if not self.cap.isOpened():
                self.is_running = False
                return False

            # Set hardware capture parameters
            self.cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
            self.cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)
            self.cap.set(cv2.CAP_PROP_BUFFERSIZE, 1)

            self.is_running = True
            self.capture_thread = threading.Thread(target=self._capture_worker, daemon=True)
            self.capture_thread.start()

        # Wait up to 1 second for first valid frame
        for _ in range(50):
            if self.latest_frame is not None:
                return True
            time.sleep(0.02)

        return self.latest_frame is not None

    def _capture_worker(self):
        """Dedicated high-speed loop draining the hardware buffer."""
        last_t = time.perf_counter()
        frames_in_sec = 0

        while self.is_running and self.cap and self.cap.isOpened():
            ret, frame = self.cap.read()
            now = time.perf_counter()
            frames_in_sec += 1
            if now - last_t >= 1.0:
                self.fps_estimate = round(frames_in_sec / (now - last_t), 1)
                frames_in_sec = 0
                last_t = now

            if ret and frame is not None:
                with self.frame_lock:
                    self.latest_frame = frame
                    self.frame_counter += 1
                    self.last_capture_time = now
            else:
                time.sleep(0.005)

    def get_latest_frame(self) -> Tuple[Optional[Image.Image], Optional[np.ndarray], int]:
        """
        Retrieves the newest frame available (Latest-Frame-Wins).
        Returns (PIL.Image, numpy.ndarray BGR, frame_id).
        """
        with self.frame_lock:
            if self.latest_frame is None:
                return None, None, self.frame_counter

            bgr = self.latest_frame.copy()
            fid = self.frame_counter

        rgb = cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB)
        pil_img = Image.fromarray(rgb)
        return pil_img, bgr, fid

    def stop(self):
        """Stops capture thread and releases video device."""
        self.is_running = False
        if self.capture_thread and self.capture_thread.is_alive():
            self.capture_thread.join(timeout=1.0)
        with self.frame_lock:
            if self.cap:
                self.cap.release()
                self.cap = None
            self.latest_frame = None

    def get_status(self) -> Dict[str, Any]:
        """Returns comprehensive device telemetry for frontend dashboard."""
        return {
            "is_active": self.is_running,
            "camera_index": self.camera_index,
            "ingestion_fps": self.fps_estimate,
            "total_captured_frames": self.frame_counter,
            "init_time_ms": round(self.init_time_ms, 1),
            "policy": "LATEST_FRAME_WINS"
        }

camera_manager = CameraManager(default_index=0)
