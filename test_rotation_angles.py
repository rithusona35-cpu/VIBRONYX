"""
Test rotation angles on portrait damaged belt image.
Tests 0 deg, 90 deg, 270 deg, and both.
"""

import os
import sys
import time
import cv2
from ultralytics import YOLO

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "final_sih_model.pt")
PORTRAIT_PATH = os.path.join(BASE_DIR, "uploads", "last_upload.jpg")

from orientation_aware_fusion import detect_orientation_views

def test_angles():
    model = YOLO(MODEL_PATH)
    img = cv2.imread(PORTRAIT_PATH)
    print(f"Portrait Image Size: {img.shape[1]}x{img.shape[0]} (Aspect ratio: {img.shape[1]/img.shape[0]:.3f})")

    # Test 0 deg
    t0 = time.perf_counter()
    res0 = detect_orientation_views(model, img, angles=[0], imgsz=800, conf=0.25)[0]
    lat0 = (time.perf_counter() - t0) * 1000.0
    print(f"Angle 0 deg:   {len(res0)} detections | Latency: {lat0:.2f} ms")

    # Test 90 deg
    t0 = time.perf_counter()
    res90 = detect_orientation_views(model, img, angles=[90], imgsz=800, conf=0.25)[90]
    lat90 = (time.perf_counter() - t0) * 1000.0
    print(f"Angle 90 deg:  {len(res90)} detections | Latency: {lat90:.2f} ms")
    if res90:
        print(f"  90 deg top defect: {res90[0]['class_name']} ({res90[0]['confidence']:.3f})")

    # Test 270 deg
    t0 = time.perf_counter()
    res270 = detect_orientation_views(model, img, angles=[270], imgsz=800, conf=0.25)[270]
    lat270 = (time.perf_counter() - t0) * 1000.0
    print(f"Angle 270 deg: {len(res270)} detections | Latency: {lat270:.2f} ms")
    if res270:
        print(f"  270 deg top defect: {res270[0]['class_name']} ({res270[0]['confidence']:.3f})")

if __name__ == "__main__":
    test_angles()
