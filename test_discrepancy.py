import os
import glob
from PIL import Image
import numpy as np
from ultralytics import YOLO

MODEL_PATH = "c:/Users/AnbuRithu/Downloads/yolo_output/belt_defect_yolo11s/run_v3_balanced/weights/best.pt"
GOLDEN_DIR = "c:/Users/AnbuRithu/Downloads/yolo_output/golden_test_images"

print(f"Loading Model: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

CLASS_NAMES = ['belt splice', 'deep scratch', 'longitudinal tear', 'normal belt', 'slight scratch']

golden_images = sorted(glob.glob(os.path.join(GOLDEN_DIR, "*.jpg")))

print("\n=== RUNNING STANDALONE VS BACKEND INFERENCE COMPARISON ===")

for img_path in golden_images:
    filename = os.path.basename(img_path)
    print(f"\n--- Testing Image: {filename} ---")
    
    # 1. Standalone Pipeline (Direct file path into Ultralytics)
    standalone_res = model.predict(source=img_path, imgsz=800, conf=0.25, iou=0.45, verbose=False)[0]
    standalone_boxes = []
    for box in standalone_res.boxes:
        cls_id = int(box.cls[0].item())
        conf = float(box.conf[0].item())
        xyxy = box.xyxy[0].tolist()
        standalone_boxes.append({
            "cls_id": cls_id,
            "cls_name": model.names[cls_id],
            "conf": round(conf, 3),
            "bbox": [round(x, 1) for x in xyxy]
        })
    
    # 2. Backend Simulation (PIL Image in memory, exact pixel decoding)
    pil_img = Image.open(img_path).convert('RGB')
    backend_res = model.predict(source=pil_img, imgsz=800, conf=0.25, iou=0.45, verbose=False)[0]
    backend_boxes = []
    for box in backend_res.boxes:
        cls_id = int(box.cls[0].item())
        conf = float(box.conf[0].item())
        xyxy = box.xyxy[0].tolist()
        backend_boxes.append({
            "cls_id": cls_id,
            "cls_name": model.names[cls_id],
            "conf": round(conf, 3),
            "bbox": [round(x, 1) for x in xyxy]
        })
        
    print(f"  Standalone Detections ({len(standalone_boxes)}): {standalone_boxes}")
    print(f"  Backend Detections    ({len(backend_boxes)}): {backend_boxes}")
    
    # Compare
    is_match = (len(standalone_boxes) == len(backend_boxes))
    if is_match:
        for sb, bb in zip(standalone_boxes, backend_boxes):
            if sb['cls_id'] != bb['cls_id'] or abs(sb['conf'] - bb['conf']) > 0.01:
                is_match = False
                break
    print(f"  --> MATCH STATUS: {'EXACT MATCH (PASS)' if is_match else 'DISCREPANCY DETECTED (FAIL)'}")
