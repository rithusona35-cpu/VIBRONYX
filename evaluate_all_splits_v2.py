import os
import glob
import json
import cv2
import numpy as np
import pandas as pd
from PIL import Image
from ultralytics import YOLO

MODEL_PATH = "c:/Users/AnbuRithu/Downloads/yolo_output/belt_defect_yolo11s/run_v3_balanced/weights/best.pt"
ORIG_DATA_YAML = "d:/SIH/anband told/data.yaml"
LEAK_FREE_YAML = "d:/SIH/anband told/leakage_free_dataset/data.yaml"
ERROR_DIR = "c:/Users/AnbuRithu/Downloads/yolo_output/error_cases"
os.makedirs(ERROR_DIR, exist_ok=True)

print(f"Loading Model: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

# 1. Evaluate on Original Test Set (71 images)
print("\n--- 1. Evaluating on Original Test Set ---")
m_orig = model.val(data=ORIG_DATA_YAML, split='test', imgsz=800, batch=16, conf=0.25, iou=0.45, verbose=False)

# 2. Evaluate on Leakage-Free Test Set (158 images)
print("\n--- 2. Evaluating on Leakage-Free Test Set ---")
m_leak_free = model.val(data=LEAK_FREE_YAML, split='test', imgsz=800, batch=16, conf=0.25, iou=0.45, verbose=False)

results_summary = {
    "Original_Test_Set": {
        "images": 71,
        "mAP50": round(float(m_orig.box.map50), 4),
        "mAP50_95": round(float(m_orig.box.map), 4),
        "precision": round(float(m_orig.box.mp), 4),
        "recall": round(float(m_orig.box.mr), 4),
        "per_class_ap50": [round(float(x), 4) for x in m_orig.box.ap50],
        "per_class_recall": [round(float(x), 4) for x in m_orig.box.r] if hasattr(m_orig.box, 'r') else []
    },
    "Leakage_Free_Test_Set": {
        "images": 158,
        "mAP50": round(float(m_leak_free.box.map50), 4),
        "mAP50_95": round(float(m_leak_free.box.map), 4),
        "precision": round(float(m_leak_free.box.mp), 4),
        "recall": round(float(m_leak_free.box.mr), 4),
        "per_class_ap50": [round(float(x), 4) for x in m_leak_free.box.ap50],
        "per_class_recall": [round(float(x), 4) for x in m_leak_free.box.r] if hasattr(m_leak_free.box, 'r') else []
    }
}

print("\n=== MULTI-SPLIT COMPARISON SUMMARY ===")
print("Original Test Set (71 imgs)     : mAP@50 =", results_summary["Original_Test_Set"]["mAP50"]*100, "% | mAP@50-95 =", results_summary["Original_Test_Set"]["mAP50_95"]*100, "%")
print("Leakage-Free Test Set (158 imgs): mAP@50 =", results_summary["Leakage_Free_Test_Set"]["mAP50"]*100, "% | mAP@50-95 =", results_summary["Leakage_Free_Test_Set"]["mAP50_95"]*100, "%")

with open("c:/Users/AnbuRithu/Downloads/yolo_output/eval_splits_v2.json", "w") as f:
    json.dump(results_summary, f, indent=2)

# 3. Generate Error Cases Visualizations
print("\n--- 3. Extracting and Visualizing Error Cases ---")
test_imgs = glob.glob("d:/SIH/anband told/test/images/*.jpg")
CLASS_NAMES = ['belt splice', 'deep scratch', 'longitudinal tear', 'normal belt', 'slight scratch']

error_records = []
for p in test_imgs[:30]:
    stem = os.path.splitext(os.path.basename(p))[0]
    lbl_p = os.path.join("d:/SIH/anband told/test/labels", stem + ".txt")
    
    # Read ground truth
    gt_boxes = []
    if os.path.exists(lbl_p):
        with open(lbl_p) as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    gt_boxes.append((int(parts[0]), list(map(float, parts[1:5]))))
                    
    # Predict
    res = model.predict(source=p, imgsz=800, conf=0.25, iou=0.45, verbose=False)[0]
    pred_boxes = []
    for b in res.boxes:
        pred_boxes.append((int(b.cls[0].item()), float(b.conf[0].item()), b.xywhn[0].tolist()))
        
    # Check for specific error types
    # False Negative: had defect in GT but pred is empty
    gt_defects = [b for b in gt_boxes if b[0] != 3] # non-normal belt
    pred_defects = [b for b in pred_boxes if b[0] != 3]
    
    img_bgr = cv2.imread(p)
    h, w = img_bgr.shape[:2]
    
    if len(gt_defects) > 0 and len(pred_defects) == 0:
        # Save False Negative case
        cv2.imwrite(os.path.join(ERROR_DIR, f"FN_{stem}.jpg"), img_bgr)
        error_records.append({"type": "False Negative", "file": stem, "gt": [CLASS_NAMES[b[0]] for b in gt_defects]})
    elif len(gt_defects) > 0 and len(pred_defects) > 0:
        # True positive or wrong class
        gt_cls = {b[0] for b in gt_defects}
        pred_cls = {b[0] for b in pred_defects}
        if gt_cls & pred_cls:
            if not os.path.exists(os.path.join(ERROR_DIR, "TP_sample.jpg")):
                annotated = res.plot()
                cv2.imwrite(os.path.join(ERROR_DIR, "TP_sample.jpg"), annotated)
                error_records.append({"type": "True Positive", "file": stem, "cls": [CLASS_NAMES[c] for c in gt_cls & pred_cls]})
        else:
            cv2.imwrite(os.path.join(ERROR_DIR, f"WrongClass_{stem}.jpg"), res.plot())
            error_records.append({"type": "Wrong Class", "file": stem, "gt": [CLASS_NAMES[b[0]] for b in gt_defects], "pred": [CLASS_NAMES[b[0]] for b in pred_defects]})

print(f"Generated {len(error_records)} visual error cases in {ERROR_DIR}")
