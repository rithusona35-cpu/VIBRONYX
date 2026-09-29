"""
Forensic Inference Pipeline Debugger
Tests Standalone Model vs Flask API vs FastAPI on 5 visible defect samples.
"""

import os
import sys
import json
import glob
import cv2
import requests
from PIL import Image
from ultralytics import YOLO

WORKSPACE_DIR = r"c:\Users\AnbuRithu\Downloads\yolo_output"
SIH_DIR = r"d:\SIH\anband told"
MODEL_PATH = os.path.join(SIH_DIR, "models", "best_model.pt")

sys.path.insert(0, SIH_DIR)
import unified_preprocessor

CLASS_NAMES = {
    0: 'Belt Splice',
    1: 'Deep Scratch',
    2: 'Longitudinal Tear',
    3: 'Normal Belt',
    4: 'Slight Scratch'
}

# Select 5 representative defect images:
# 1. Belt Splice
# 2. Longitudinal Tear
# 3. Deep Scratch
# 4. Slight Scratch
# 5. Severe Visible Defect (Splice + Tear co-occurrence)
test_candidates = [
    # 1. Splice
    os.path.join(SIH_DIR, "golden_test_images", "frame_00015_jpg.rf.8130d85e915ded4d5e29721b9dda2ff3.jpg"),
    # 2. Longitudinal Tear
    os.path.join(SIH_DIR, "golden_test_images", "frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg"),
    # 3. Deep Scratch
    os.path.join(SIH_DIR, "golden_test_images", "frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg"),
    # 4. Slight Scratch
    os.path.join(SIH_DIR, "golden_test_images", "frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg"),
    # 5. Severe Defect (Splice + Large Longitudinal Tear)
    os.path.join(SIH_DIR, "golden_test_images", "frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg")
]

print(f"Loading Standalone Model from: {MODEL_PATH}")
standalone_model = YOLO(MODEL_PATH)
print("Model loaded successfully.")

flask_url = "http://127.0.0.1:5000/api/detect"
fastapi_url = "http://127.0.0.1:8000/api/detect"

debug_results = []

for idx, img_path in enumerate(test_candidates):
    fname = os.path.basename(img_path)
    img_bgr = cv2.imread(img_path)
    h, w = img_bgr.shape[:2]
    
    # 1. Standalone Inference
    std_res = standalone_model.predict(source=img_path, imgsz=800, conf=0.25, iou=0.45, verbose=False)[0]
    std_dets = []
    for b in std_res.boxes:
        cid = int(b.cls[0].item())
        conf = float(b.conf[0].item())
        bbox = [round(x, 1) for x in b.xyxy[0].tolist()]
        std_dets.append({
            "class_id": cid,
            "class_name": CLASS_NAMES.get(cid, f"Unknown_{cid}"),
            "confidence": round(conf, 4),
            "bbox": bbox
        })
        
    # 2. Flask API via Multipart File Upload
    flask_dets = []
    flask_status = "ERROR"
    flask_latency = None
    try:
        with open(img_path, "rb") as f:
            resp = requests.post(flask_url, files={"file": (fname, f, "image/jpeg")}, timeout=10)
        if resp.status_code == 200:
            f_json = resp.json()
            flask_status = f_json.get("status", "UNKNOWN")
            flask_latency = f_json.get("latency_ms")
            for d in f_json.get("detections", []):
                flask_dets.append({
                    "class_id": d["class_id"],
                    "class_name": d["display_name"],
                    "confidence": round(d["confidence"], 4),
                    "bbox": d["bbox"]
                })
        else:
            flask_status = f"HTTP_{resp.status_code}"
    except Exception as e:
        flask_status = f"EXCEPTION: {str(e)}"
        
    # 3. FastAPI API via Multipart File Upload
    fastapi_dets = []
    fastapi_status = "ERROR"
    fastapi_latency = None
    try:
        with open(img_path, "rb") as f:
            resp = requests.post(fastapi_url, files={"file": (fname, f, "image/jpeg")}, timeout=10)
        if resp.status_code == 200:
            fa_json = resp.json()
            fastapi_status = fa_json.get("status", "UNKNOWN")
            fastapi_latency = fa_json.get("latency_ms")
            for d in fa_json.get("detections", []):
                fastapi_dets.append({
                    "class_id": d["class_id"],
                    "class_name": d["display_name"],
                    "confidence": round(d["confidence"], 4),
                    "bbox": d["bbox"]
                })
        else:
            fastapi_status = f"HTTP_{resp.status_code}"
    except Exception as e:
        fastapi_status = f"EXCEPTION: {str(e)}"
        
    debug_results.append({
        "sample_num": idx + 1,
        "filename": fname,
        "width": w,
        "height": h,
        "standalone": {
            "total_detections": len(std_dets),
            "detections": std_dets
        },
        "flask_api": {
            "status": flask_status,
            "latency_ms": flask_latency,
            "total_detections": len(flask_dets),
            "detections": flask_dets
        },
        "fastapi_api": {
            "status": fastapi_status,
            "latency_ms": fastapi_latency,
            "total_detections": len(fastapi_dets),
            "detections": fastapi_dets
        }
    })
    
    print(f"\n==================== SAMPLE {idx+1}: {fname} ({w}x{h}) ====================")
    print(f"STANDALONE ({len(std_dets)} dets): {[(d['class_name'], d['confidence']) for d in std_dets]}")
    print(f"FLASK API  ({len(flask_dets)} dets, status={flask_status}, lat={flask_latency}ms): {[(d['class_name'], d['confidence']) for d in flask_dets]}")
    print(f"FASTAPI    ({len(fastapi_dets)} dets, status={fastapi_status}, lat={fastapi_latency}ms): {[(d['class_name'], d['confidence']) for d in fastapi_dets]}")

with open(os.path.join(WORKSPACE_DIR, "API_INFERENCE_DEBUG.json"), "w") as f:
    json.dump(debug_results, f, indent=2)

print("\nSaved API_INFERENCE_DEBUG.json successfully!")
