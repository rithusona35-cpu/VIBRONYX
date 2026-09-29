"""
25-Image Benchmark Evaluation:
5 Belt Splice
5 Longitudinal Tear
5 Deep Scratch
5 Slight Scratch
5 Normal Belt (Pure Clean Belt)
"""
import os
import sys
import json
import requests
from ultralytics import YOLO

SIH_DIR = r"d:\SIH\anband told"
MODEL_PATH = os.path.join(SIH_DIR, "models", "best_model.pt")
model = YOLO(MODEL_PATH)
test_dir = os.path.join(SIH_DIR, "test", "images")

CLASS_NAMES = ['Belt Splice', 'Deep Scratch', 'Longitudinal Tear', 'Normal Belt', 'Slight Scratch']

samples = [
    # 5 Belt Splice
    ("frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg", "Belt Splice"),
    ("frame_00003_jpg.rf.49968cb55095c8b650a32b4de9b866a4.jpg", "Belt Splice"),
    ("frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg", "Belt Splice"),
    ("frame_00012_jpg.rf.0bccc92f2975e1b5d666489e29c08648.jpg", "Belt Splice"),
    ("frame_00015_jpg.rf.8130d85e915ded4d5e29721b9dda2ff3.jpg", "Belt Splice"),
    
    # 5 Longitudinal Tear
    ("frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg", "Longitudinal Tear"),
    ("frame_00019_jpg.rf.c9d90cbe0a1e82afbccd085d19bd1cae.jpg", "Longitudinal Tear"),
    ("frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg", "Longitudinal Tear"),
    ("frame_00043_jpg.rf.18a2450e12175f4369c1a958dc52304b.jpg", "Longitudinal Tear"),
    ("frame_00045_jpg.rf.1ad7ac3267692d24b90701ef60772951.jpg", "Longitudinal Tear"),
    
    # 5 Deep Scratch
    ("frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg", "Deep Scratch"),
    ("frame_00052_jpg.rf.28706526d8f19576dc058ac9629bc90a.jpg", "Deep Scratch"),
    ("frame_00055_jpg.rf.21c7dbe8fddf9f4b645d945f63c435b2.jpg", "Deep Scratch"),
    ("frame_00068_jpg.rf.7da2953212e752b7957050e8ee29e21a.jpg", "Deep Scratch"),
    ("frame_00121_jpg.rf.35938fe6d80f1299c994e9cb2adbac77.jpg", "Deep Scratch"),
    
    # 5 Slight Scratch
    ("frame_00012_jpg.rf.0bccc92f2975e1b5d666489e29c08648.jpg", "Slight Scratch"),
    ("frame_00046_jpg.rf.9075689b3baa501f6d8d9f1d91930a32.jpg", "Slight Scratch"),
    ("frame_00129_jpg.rf.7719d1d835cab947ea466cdf7469001a.jpg", "Slight Scratch"),
    ("frame_00056_jpg.rf.7154a70d40a859c07c4f74152c8ad5f8.jpg", "Slight Scratch"),
    ("frame_00064_jpg.rf.388be8135d2ae5802f530028dd44d209.jpg", "Slight Scratch"),
    
    # 5 Normal Belt (Pure Clean Belt)
    ("frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg", "Normal Belt"),
    ("frame_00121_jpg.rf.e676092e667ba16cc8dbaea2e3f6e68e.jpg", "Normal Belt"),
    ("frame_00122_jpg.rf.ef82374d953643dc00d5b2e740175659.jpg", "Normal Belt"),
    ("frame_20260504_001606_073276_jpg.rf.4548423d7cd1e025f133c156c2ba2c5b.jpg", "Normal Belt"),
    ("frame_20260504_003223_261865_jpg.rf.c57cb6c90f2306caa729815a699c3894.jpg", "Normal Belt")
]

records = []
api_url = "http://127.0.0.1:5000/api/detect"

for fname, target_gt in samples:
    img_path = os.path.join(test_dir, fname)
    if not os.path.exists(img_path):
        continue
        
    # Standalone
    res = model.predict(source=img_path, imgsz=800, conf=0.25, iou=0.45, verbose=False)[0]
    std_classes = [CLASS_NAMES[int(b.cls[0].item())] for b in res.boxes]
    
    # API
    with open(img_path, "rb") as f:
        r = requests.post(api_url, files={"file": (fname, f, "image/jpeg")}, timeout=10)
    api_json = r.json()
    api_classes = [d["display_name"] for d in api_json.get("detections", [])]
    api_status = api_json.get("status", "")
    
    # UI Current Logic:
    # if total_detections == 0: BELT INTEGRITY HEALTHY
    # else: CRITICAL ANOMALY ALERT or DEFECT DETECTED
    if api_json.get("total_detections", 0) == 0:
        ui_display = "BELT INTEGRITY HEALTHY"
    elif "CRITICAL" in api_status:
        ui_display = "CRITICAL ANOMALY ALERT"
    else:
        ui_display = "DEFECT DETECTED"
        
    # Match analysis
    if target_gt == "Normal Belt":
        # Desired: 0 detections or Normal Belt
        pass_flag = (len(api_classes) == 0 or "Normal Belt" in api_classes)
    else:
        pass_flag = (target_gt in api_classes)
        
    records.append({
        "image": fname,
        "ground_truth": target_gt,
        "model_detections": std_classes,
        "api_detections": api_classes,
        "ui_display": ui_display,
        "match": "PASS" if pass_flag else "MISSED"
    })

print(f"Evaluated {len(records)} samples:")
for r in records:
    print(f"[{r['match']}] {r['ground_truth']:18} | Model: {str(r['model_detections']):30} | UI: {r['ui_display']:24} | {r['image'][:25]}...")

with open("c:/Users/AnbuRithu/Downloads/yolo_output/benchmark_25_audit.json", "w") as f:
    json.dump(records, f, indent=2)
