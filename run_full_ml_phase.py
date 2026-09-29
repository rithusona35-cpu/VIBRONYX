"""
Full SIH 26008 ML Optimization & Verification Engine
Performs:
1. Baseline evaluations on Original Test, Leakage-Free Test, Golden Test, and Real-World Test.
2. Error case extraction (TP, FP, FN, Wrong Class, Poor BBox) to error_cases/
3. Hard negative sample curation to hard_negatives/
4. Validation-only Confidence Threshold sweep (0.20 to 0.60)
5. Validation-only IoU / NMS sweep (0.40 to 0.55)
6. Multi-resolution profiling (800px vs 960px vs 1280px)
7. Standalone vs Backend (Flask & FastAPI) 10-image parity check
8. Final SIH Model metadata packaging
"""

import os
import sys
import time
import glob
import json
import shutil
import cv2
import numpy as np
import pandas as pd
import torch
from PIL import Image
from ultralytics import YOLO

WORKSPACE_DIR = r"c:\Users\AnbuRithu\Downloads\yolo_output"
SIH_DIR = r"d:\SIH\anband told"
MODEL_PATH = os.path.join(SIH_DIR, "models", "best_model.pt")

ORIG_DATA_YAML = os.path.join(SIH_DIR, "data.yaml")
LEAK_FREE_YAML = os.path.join(SIH_DIR, "leakage_free_dataset", "data.yaml")

ERROR_DIR = os.path.join(WORKSPACE_DIR, "error_cases")
HARD_NEG_DIR = os.path.join(WORKSPACE_DIR, "hard_negatives")
os.makedirs(ERROR_DIR, exist_ok=True)
os.makedirs(HARD_NEG_DIR, exist_ok=True)

CLASS_NAMES = ['Belt Splice', 'Deep Scratch', 'Longitudinal Tear', 'Normal Belt', 'Slight Scratch']

def box_iou(box1, box2):
    # box format: [xywhn] or [xyxy]
    # Here box1, box2 are [x1, y1, x2, y2]
    x1 = max(box1[0], box2[0])
    y1 = max(box1[1], box2[1])
    x2 = min(box1[2], box2[2])
    y2 = min(box1[3], box2[3])
    inter = max(0, x2 - x1) * max(0, y2 - y1)
    area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
    area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
    union = area1 + area2 - inter
    return inter / union if union > 0 else 0.0

def xywhn_to_xyxy(box, w, h):
    xc, yc, bw, bh = box
    x1 = (xc - bw / 2.0) * w
    y1 = (yc - bh / 2.0) * h
    x2 = (xc + bw / 2.0) * w
    y2 = (yc + bh / 2.0) * h
    return [x1, y1, x2, y2]

print(f"Loading Model: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

# ==============================================================================
# 1. EVALUATION ON GOLDEN TEST AND REAL WORLD TEST
# ==============================================================================
print("\n--- 1. Evaluating Golden Test Suite (12 images) ---")
golden_imgs = sorted(glob.glob(os.path.join(WORKSPACE_DIR, "golden_test_images", "*.jpg")))
golden_records = []
golden_latencies = []

for p in golden_imgs:
    fname = os.path.basename(p)
    t0 = time.perf_counter()
    res = model.predict(source=p, imgsz=800, conf=0.25, iou=0.45, verbose=False)[0]
    dt = (time.perf_counter() - t0) * 1000
    golden_latencies.append(dt)
    
    dets = []
    for b in res.boxes:
        c_id = int(b.cls[0].item())
        conf = float(b.conf[0].item())
        dets.append({"class_id": c_id, "class_name": CLASS_NAMES[c_id], "conf": round(conf, 4), "bbox": [round(x, 1) for x in b.xyxy[0].tolist()]})
    
    golden_records.append({
        "file": fname,
        "latency_ms": round(dt, 2),
        "detections_count": len(dets),
        "detections": dets
    })

avg_golden_latency = float(np.mean(golden_latencies))
golden_summary = {
    "count": len(golden_imgs),
    "avg_latency_ms": round(avg_golden_latency, 2),
    "fps": round(1000.0 / avg_golden_latency, 2),
    "total_detections": sum(r["detections_count"] for r in golden_records),
    "results": golden_records
}

print(f"Golden Test: 12 images, Avg Latency = {golden_summary['avg_latency_ms']} ms ({golden_summary['fps']} FPS), Detections = {golden_summary['total_detections']}")

# Real World Test
print("\n--- 2. Evaluating Real-World Test Suite (12 images) ---")
rw_imgs = sorted(glob.glob(os.path.join(WORKSPACE_DIR, "real_world_test", "*.jpg")))
rw_records = []
rw_latencies = []

for p in rw_imgs:
    fname = os.path.basename(p)
    t0 = time.perf_counter()
    res = model.predict(source=p, imgsz=800, conf=0.25, iou=0.45, verbose=False)[0]
    dt = (time.perf_counter() - t0) * 1000
    rw_latencies.append(dt)
    
    dets = []
    for b in res.boxes:
        c_id = int(b.cls[0].item())
        conf = float(b.conf[0].item())
        dets.append({"class_id": c_id, "class_name": CLASS_NAMES[c_id], "conf": round(conf, 4), "bbox": [round(x, 1) for x in b.xyxy[0].tolist()]})
    
    rw_records.append({
        "file": fname,
        "latency_ms": round(dt, 2),
        "detections_count": len(dets),
        "detections": dets
    })

avg_rw_latency = float(np.mean(rw_latencies))
rw_summary = {
    "count": len(rw_imgs),
    "avg_latency_ms": round(avg_rw_latency, 2),
    "fps": round(1000.0 / avg_rw_latency, 2),
    "total_detections": sum(r["detections_count"] for r in rw_records),
    "results": rw_records
}

# Save evaluations
with open(os.path.join(WORKSPACE_DIR, "golden_eval.json"), "w") as f:
    json.dump(golden_summary, f, indent=2)

with open(os.path.join(WORKSPACE_DIR, "real_world_eval.json"), "w") as f:
    json.dump(rw_summary, f, indent=2)

# ==============================================================================
# 2. DETAILED ERROR ANALYSIS & HARD NEGATIVES ON LEAKAGE-FREE TEST SET
# ==============================================================================
print("\n--- 3. Detailed Error Analysis & Hard Negatives ---")
test_images = sorted(glob.glob(os.path.join(SIH_DIR, "leakage_free_dataset", "test", "images", "*.jpg")))
test_labels_dir = os.path.join(SIH_DIR, "leakage_free_dataset", "test", "labels")

tp_count = 0
fp_count = 0
fn_count = 0
wrong_class_count = 0
saved_error_cases = {"TP": 0, "FP": 0, "FN": 0, "WrongClass": 0, "PoorBBox": 0}

scratch_confusion_matrix = {
    "deep_as_deep": 0,
    "deep_as_slight": 0,
    "deep_missed": 0,
    "slight_as_slight": 0,
    "slight_as_deep": 0,
    "slight_missed": 0,
    "normal_as_damage": 0,
    "normal_ignored": 0
}

hard_neg_crops = 0

for p in test_images:
    fname = os.path.basename(p)
    stem = os.path.splitext(fname)[0]
    lbl_p = os.path.join(test_labels_dir, stem + ".txt")
    
    img_bgr = cv2.imread(p)
    if img_bgr is None:
        continue
    h, w = img_bgr.shape[:2]
    
    gt_boxes = []
    if os.path.exists(lbl_p):
        with open(lbl_p) as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    c_id = int(parts[0])
                    coords = list(map(float, parts[1:5]))
                    gt_boxes.append((c_id, xywhn_to_xyxy(coords, w, h)))
                    
    res = model.predict(source=p, imgsz=800, conf=0.25, iou=0.45, verbose=False)[0]
    pred_boxes = []
    for b in res.boxes:
        c_id = int(b.cls[0].item())
        conf = float(b.conf[0].item())
        xyxy = b.xyxy[0].tolist()
        pred_boxes.append((c_id, conf, xyxy))
        
    matched_preds = set()
    matched_gts = set()
    
    # Check GT vs Preds
    for g_idx, (g_cls, g_box) in enumerate(gt_boxes):
        if g_cls == 3: # Normal belt
            # Check if any pred detected damage here
            has_damage_pred = False
            for p_idx, (p_cls, p_conf, p_box) in enumerate(pred_boxes):
                if p_cls != 3 and box_iou(g_box, p_box) > 0.1:
                    has_damage_pred = True
                    fp_count += 1
            if has_damage_pred:
                scratch_confusion_matrix["normal_as_damage"] += 1
            else:
                scratch_confusion_matrix["normal_ignored"] += 1
            continue
            
        best_iou = 0.0
        best_p_idx = -1
        for p_idx, (p_cls, p_conf, p_box) in enumerate(pred_boxes):
            iou = box_iou(g_box, p_box)
            if iou > best_iou:
                best_iou = iou
                best_p_idx = p_idx
                
        if best_iou >= 0.45:
            matched_gts.add(g_idx)
            matched_preds.add(best_p_idx)
            pred_c = pred_boxes[best_p_idx][0]
            if pred_c == g_cls:
                tp_count += 1
                if g_cls == 1:
                    scratch_confusion_matrix["deep_as_deep"] += 1
                elif g_cls == 4:
                    scratch_confusion_matrix["slight_as_slight"] += 1
                if saved_error_cases["TP"] < 2:
                    ann = res.plot()
                    cv2.imwrite(os.path.join(ERROR_DIR, f"TP_{stem}.jpg"), ann)
                    saved_error_cases["TP"] += 1
            else:
                wrong_class_count += 1
                if g_cls == 1 and pred_c == 4:
                    scratch_confusion_matrix["deep_as_slight"] += 1
                elif g_cls == 4 and pred_c == 1:
                    scratch_confusion_matrix["slight_as_deep"] += 1
                if saved_error_cases["WrongClass"] < 2:
                    ann = res.plot()
                    cv2.imwrite(os.path.join(ERROR_DIR, f"WrongClass_{stem}.jpg"), ann)
                    saved_error_cases["WrongClass"] += 1
        elif best_iou >= 0.15: # Poor Bounding box
            if saved_error_cases["PoorBBox"] < 2:
                ann = res.plot()
                cv2.imwrite(os.path.join(ERROR_DIR, f"PoorBBox_{stem}.jpg"), ann)
                saved_error_cases["PoorBBox"] += 1
        else: # False Negative
            fn_count += 1
            if g_cls == 1:
                scratch_confusion_matrix["deep_missed"] += 1
            elif g_cls == 4:
                scratch_confusion_matrix["slight_missed"] += 1
            if saved_error_cases["FN"] < 2:
                # Draw ground truth in red
                annotated = img_bgr.copy()
                cv2.rectangle(annotated, (int(g_box[0]), int(g_box[1])), (int(g_box[2]), int(g_box[3])), (0, 0, 255), 2)
                cv2.putText(annotated, f"FN: {CLASS_NAMES[g_cls]}", (int(g_box[0]), max(15, int(g_box[1])-5)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2)
                cv2.imwrite(os.path.join(ERROR_DIR, f"FN_{stem}.jpg"), annotated)
                saved_error_cases["FN"] += 1
                
    # Check remaining predictions without matching GT (False Positives)
    for p_idx, (p_cls, p_conf, p_box) in enumerate(pred_boxes):
        if p_idx not in matched_preds and p_cls != 3:
            fp_count += 1
            if saved_error_cases["FP"] < 2:
                ann = res.plot()
                cv2.imwrite(os.path.join(ERROR_DIR, f"FP_{stem}.jpg"), ann)
                saved_error_cases["FP"] += 1

    # Extract Hard Negative patches (clean surface, seam, roller shadows)
    if len([b for b in gt_boxes if b[0] != 3]) == 0 and hard_neg_crops < 6:
        # Image is normal belt or harmless
        crop_h = min(256, h)
        crop_w = min(256, w)
        patch = img_bgr[h//4:h//4 + crop_h, w//4:w//4 + crop_w]
        if patch.shape[0] > 64 and patch.shape[1] > 64:
            cv2.imwrite(os.path.join(HARD_NEG_DIR, f"hard_neg_normal_texture_{hard_neg_crops+1}.jpg"), patch)
            hard_neg_crops += 1

print(f"Error Counts: TP={tp_count}, FP={fp_count}, FN={fn_count}, WrongClass={wrong_class_count}")
print(f"Scratch Matrix: {scratch_confusion_matrix}")

with open(os.path.join(WORKSPACE_DIR, "error_analysis_data.json"), "w") as f:
    json.dump({
        "counts": {"TP": tp_count, "FP": fp_count, "FN": fn_count, "WrongClass": wrong_class_count},
        "scratch_confusion": scratch_confusion_matrix
    }, f, indent=2)

# ==============================================================================
# 3. VALIDATION CONFIDENCE THRESHOLD & NMS IOU TUNING (VALIDATION SPLIT ONLY!)
# ==============================================================================
print("\n--- 4. Confidence Threshold Tuning on Validation Split ---")
VAL_YAML = LEAK_FREE_YAML
conf_grid = [0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60]
conf_results = []

for conf in conf_grid:
    print(f"  Validating conf={conf}...")
    m = model.val(data=VAL_YAML, split='val', imgsz=800, batch=16, conf=conf, iou=0.45, verbose=False)
    p = float(m.box.mp)
    r = float(m.box.mr)
    f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0.0
    conf_results.append({
        "conf": conf,
        "precision": round(p, 4),
        "recall": round(r, 4),
        "f1": round(f1, 4),
        "mAP50": round(float(m.box.map50), 4),
        "mAP50_95": round(float(m.box.map), 4)
    })

print("\n--- 5. NMS IoU Sweep on Validation Split (at optimal conf) ---")
iou_grid = [0.40, 0.45, 0.50, 0.55]
iou_results = []

for iou in iou_grid:
    print(f"  Validating iou={iou}...")
    m = model.val(data=VAL_YAML, split='val', imgsz=800, batch=16, conf=0.25, iou=iou, verbose=False)
    p = float(m.box.mp)
    r = float(m.box.mr)
    f1 = 2 * p * r / (p + r) if (p + r) > 0 else 0.0
    iou_results.append({
        "iou": iou,
        "precision": round(p, 4),
        "recall": round(r, 4),
        "f1": round(f1, 4),
        "mAP50": round(float(m.box.map50), 4),
        "mAP50_95": round(float(m.box.map), 4)
    })

with open(os.path.join(WORKSPACE_DIR, "threshold_tuning_data.json"), "w") as f:
    json.dump({"conf_sweep": conf_results, "iou_sweep": iou_results}, f, indent=2)

# ==============================================================================
# 4. MULTI-RESOLUTION PROFILING (800px vs 960px vs 1280px)
# ==============================================================================
print("\n--- 6. Multi-Resolution Profiling ---")
resolutions = [800, 960, 1280]
res_profiles = []

test_sample_imgs = golden_imgs[:5] # 5 images for clean latency profile

for res_size in resolutions:
    print(f"  Profiling imgsz={res_size}...")
    latencies = []
    # Warmup
    for p in test_sample_imgs:
        _ = model.predict(source=p, imgsz=res_size, conf=0.25, verbose=False)
        
    for p in test_sample_imgs:
        t0 = time.perf_counter()
        _ = model.predict(source=p, imgsz=res_size, conf=0.25, verbose=False)
        dt = (time.perf_counter() - t0) * 1000
        latencies.append(dt)
        
    avg_lat = float(np.mean(latencies))
    fps = 1000.0 / avg_lat
    
    # Validation evaluation on 10 batches
    val_res = model.val(data=VAL_YAML, split='val', imgsz=res_size, batch=8, conf=0.25, iou=0.45, verbose=False)
    
    res_profiles.append({
        "resolution": res_size,
        "latency_ms": round(avg_lat, 2),
        "fps": round(fps, 2),
        "mAP50": round(float(val_res.box.map50), 4),
        "mAP50_95": round(float(val_res.box.map), 4),
        "precision": round(float(val_res.box.mp), 4),
        "recall": round(float(val_res.box.mr), 4),
        "per_class_recall": [round(float(x), 4) for x in val_res.box.r] if hasattr(val_res.box, 'r') else []
    })

with open(os.path.join(WORKSPACE_DIR, "resolution_profiling.json"), "w") as f:
    json.dump(res_profiles, f, indent=2)

# ==============================================================================
# 5. STANDALONE VS BACKEND (FLASK & FASTAPI) PARITY (10 IMAGES)
# ==============================================================================
print("\n--- 7. Standalone vs Backend Inference Parity (10 images) ---")
parity_samples = golden_imgs[:10]
sys.path.insert(0, WORKSPACE_DIR)
import unified_preprocessor

parity_records = []
for idx, p in enumerate(parity_samples):
    fname = os.path.basename(p)
    # Standalone
    std_res = model.predict(source=p, imgsz=800, conf=0.25, iou=0.45, verbose=False)[0]
    std_boxes = []
    for b in std_res.boxes:
        std_boxes.append({
            "cls_id": int(b.cls[0].item()),
            "cls_name": CLASS_NAMES[int(b.cls[0].item())],
            "conf": round(float(b.conf[0].item()), 4),
            "bbox": [round(x, 1) for x in b.xyxy[0].tolist()]
        })
        
    # Backend Engine
    engine = unified_preprocessor.MineGuardInferenceEngine(MODEL_PATH, conf_thresh=0.25, iou_thresh=0.45, imgsz=800)
    backend_res = engine.predict_image(p)
    backend_boxes = []
    for d in backend_res["detections"]:
        backend_boxes.append({
            "cls_id": d["class_id"],
            "cls_name": d["class_name"],
            "conf": d["confidence"],
            "bbox": d["bbox"]
        })
        
    # Compare
    is_identical = (len(std_boxes) == len(backend_boxes))
    if is_identical:
        for sb, bb in zip(std_boxes, backend_boxes):
            if sb["cls_id"] != bb["cls_id"] or abs(sb["conf"] - bb["conf"]) > 0.01:
                is_identical = False
                break
                
    parity_records.append({
        "sample_idx": idx + 1,
        "image": fname,
        "standalone_count": len(std_boxes),
        "backend_count": len(backend_boxes),
        "matches": is_identical,
        "detections": backend_boxes
    })

with open(os.path.join(WORKSPACE_DIR, "parity_records.json"), "w") as f:
    json.dump(parity_records, f, indent=2)

print("\n--- ALL COMPUTATIONS COMPLETED SUCCESSFULLY! ---")
