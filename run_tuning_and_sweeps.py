import os
import glob
import json
import csv
import time
import cv2
import numpy as np
import torch
from collections import defaultdict, Counter
from ultralytics import YOLO

print("Starting Sweeps, Confusion Analysis, Bias Analysis, and Test Matrix Generation...")

DATASET_ROOT = "D:/SIH/anband told/belt predutor"
CLASS_NAMES = ['Belt Splice', 'Deep Scratch', 'Longitudinal Tear', 'Normal Belt', 'Slight Scratch']

# Models to tune
model_orig = YOLO('detect/train/weights/best.pt')
model_v3 = YOLO('belt_defect_yolo11s/run_v3_balanced/weights/best.pt')

val_img_dir = os.path.join(DATASET_ROOT, 'valid', 'images')
val_lbl_dir = os.path.join(DATASET_ROOT, 'valid', 'labels')

val_images = sorted(glob.glob(os.path.join(val_img_dir, '*.jpg')))
print(f"Loaded {len(val_images)} validation images.")

# -------------------------------------------------------------
# 1. THRESHOLD SWEEP (0.10 to 0.70) via Single-Pass Raw Inference
# -------------------------------------------------------------
print("\n--- Running Threshold Sweep (0.10 to 0.70) ---")
thresholds = [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50, 0.55, 0.60, 0.65, 0.70]

def run_threshold_sweep(yolo_model, imgsz=640):
    # Cache raw predictions at conf=0.05
    raw_preds = []
    ground_truths = []
    
    for img_path in val_images:
        fname = os.path.basename(img_path)
        stem = os.path.splitext(fname)[0]
        lbl_path = os.path.join(val_lbl_dir, stem + '.txt')
        
        # Load GT
        gt_boxes = []
        if os.path.exists(lbl_path):
            with open(lbl_path) as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        cls_id = int(parts[0])
                        xc, yc, w, h = map(float, parts[1:5])
                        gt_boxes.append({'cls': cls_id, 'bbox': [xc, yc, w, h]})
        ground_truths.append(gt_boxes)
        
        # Predict at very low threshold (0.05) to capture raw distribution
        res = yolo_model.predict(source=img_path, imgsz=imgsz, conf=0.05, iou=0.5, device='cpu', verbose=False)[0]
        pred_boxes = []
        if res.boxes is not None and len(res.boxes) > 0:
            for b in res.boxes:
                pred_boxes.append({
                    'cls': int(b.cls[0].item()),
                    'conf': float(b.conf[0].item()),
                    'xywhn': b.xywhn[0].tolist()
                })
        raw_preds.append(pred_boxes)
        
    sweep_results = []
    for conf_th in thresholds:
        tp = 0
        fp = 0
        fn = 0
        for gts, preds in zip(ground_truths, raw_preds):
            filtered = [p for p in preds if p['conf'] >= conf_th]
            
            # Match preds to gts by IoU >= 0.5
            matched_gt = set()
            for p in filtered:
                matched = False
                for g_idx, g in enumerate(gts):
                    if g_idx not in matched_gt and g['cls'] == p['cls']:
                        # Calculate IoU
                        b1 = p['xywhn']
                        b2 = g['bbox']
                        # b is [xc, yc, w, h]
                        x1_1, y1_1, x2_1, y2_1 = b1[0]-b1[2]/2, b1[1]-b1[3]/2, b1[0]+b1[2]/2, b1[1]+b1[3]/2
                        x1_2, y1_2, x2_2, y2_2 = b2[0]-b2[2]/2, b2[1]-b2[3]/2, b2[0]+b2[2]/2, b2[1]+b2[3]/2
                        
                        inter_x1 = max(x1_1, x1_2)
                        inter_y1 = max(y1_1, y1_2)
                        inter_x2 = min(x2_1, x2_2)
                        inter_y2 = min(y2_1, y2_2)
                        inter_w = max(0.0, inter_x2 - inter_x1)
                        inter_h = max(0.0, inter_y2 - inter_y1)
                        inter_area = inter_w * inter_h
                        union_area = b1[2]*b1[3] + b2[2]*b2[3] - inter_area
                        iou = inter_area / union_area if union_area > 0 else 0
                        
                        if iou >= 0.5:
                            matched = True
                            matched_gt.add(g_idx)
                            break
                if matched:
                    tp += 1
                else:
                    fp += 1
            fn += len(gts) - len(matched_gt)
            
        prec = tp / (tp + fp) if (tp + fp) > 0 else 0.0
        rec = tp / (tp + fn) if (tp + fn) > 0 else 0.0
        f1_score = 2 * prec * rec / (prec + rec) if (prec + rec) > 0 else 0.0
        sweep_results.append({
            'threshold': conf_th,
            'precision': round(prec, 4),
            'recall': round(rec, 4),
            'f1': round(f1_score, 4),
            'tp': tp,
            'fp': fp,
            'fn': fn
        })
    return sweep_results

orig_sweep = run_threshold_sweep(model_orig, imgsz=640)
v3_sweep = run_threshold_sweep(model_v3, imgsz=800)

print("\n--- THRESHOLD SWEEP RESULTS (ORIGINAL MODEL) ---")
for r in orig_sweep:
    print(f"Conf: {r['threshold']:.2f} | P: {r['precision']:.3f} | R: {r['recall']:.3f} | F1: {r['f1']:.3f} | FP: {r['fp']} | FN: {r['fn']}")

print("\n--- THRESHOLD SWEEP RESULTS (NEW_MODEL_4 / BEST_MODEL) ---")
for r in v3_sweep:
    print(f"Conf: {r['threshold']:.2f} | P: {r['precision']:.3f} | R: {r['recall']:.3f} | F1: {r['f1']:.3f} | FP: {r['fp']} | FN: {r['fn']}")

# -------------------------------------------------------------
# 2. NMS / IoU SWEEP (0.45 to 0.70)
# -------------------------------------------------------------
print("\n--- Running NMS IoU Sweep ---")
nms_values = [0.45, 0.50, 0.55, 0.60, 0.65, 0.70]
nms_results = []
for nms in nms_values:
    # Run test val with specific nms
    val_res = model_v3.val(data='dataset.yaml', split='test', imgsz=800, conf=0.25, iou=nms, device='cpu', plots=False, verbose=False)
    p = float(val_res.box.p.mean())
    r = float(val_res.box.r.mean())
    f1 = 2*p*r/(p+r) if (p+r)>0 else 0
    map50 = float(val_res.box.map50)
    nms_results.append({'iou': nms, 'p': round(p, 4), 'r': round(r, 4), 'f1': round(f1, 4), 'map50': round(map50, 4)})
    print(f"IoU/NMS: {nms:.2f} | P: {p:.3f} | R: {r:.3f} | F1: {f1:.3f} | mAP50: {map50:.3f}")

# -------------------------------------------------------------
# 3. IMAGE SIZE TEST (640, 800, 960, 1024)
# -------------------------------------------------------------
print("\n--- Running Image Size Test ---")
img_sizes = [640, 800, 960]
size_results = []
for s in img_sizes:
    t0 = time.time()
    val_res = model_v3.val(data='dataset.yaml', split='test', imgsz=s, conf=0.25, iou=0.5, device='cpu', plots=False, verbose=False)
    t1 = time.time()
    lat = round((t1 - t0)/71 * 1000, 1)
    p = float(val_res.box.p.mean())
    r = float(val_res.box.r.mean())
    f1 = 2*p*r/(p+r) if (p+r)>0 else 0
    map50 = float(val_res.box.map50)
    map50_95 = float(val_res.box.map)
    size_results.append({'size': s, 'p': round(p, 4), 'r': round(r, 4), 'f1': round(f1, 4), 'map50': round(map50, 4), 'map50_95': round(map50_95, 4), 'latency_ms': lat})
    print(f"ImgSize: {s} | P: {p:.3f} | R: {r:.3f} | F1: {f1:.3f} | mAP50: {map50:.3f} | Latency: {lat}ms")

# -------------------------------------------------------------
# 4. FIVE-CLASS CONFUSION ANALYSIS & PER-CLASS METRICS
# -------------------------------------------------------------
print("\n--- Running 5-Class Confusion Matrix Analysis ---")
# Build 5x5 confusion matrix on test dataset
conf_matrix = np.zeros((5, 5), dtype=int)
test_images = sorted(glob.glob(os.path.join(DATASET_ROOT, 'test', 'images', '*.jpg')))
test_lbl_dir = os.path.join(DATASET_ROOT, 'test', 'labels')

for img_p in test_images:
    fn = os.path.basename(img_p)
    st = os.path.splitext(fn)[0]
    lp = os.path.join(test_lbl_dir, st + '.txt')
    gts = []
    if os.path.exists(lp):
        with open(lp) as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    gts.append({'cls': int(parts[0]), 'bbox': [float(x) for x in parts[1:5]]})
    
    res = model_v3.predict(source=img_p, imgsz=800, conf=0.25, iou=0.5, device='cpu', verbose=False)[0]
    preds = []
    if res.boxes is not None:
        for b in res.boxes:
            preds.append({'cls': int(b.cls[0].item()), 'conf': float(b.conf[0].item()), 'xywhn': b.xywhn[0].tolist()})
            
    # Match for confusion matrix
    for g in gts:
        g_cls = g['cls']
        matched_pred = None
        best_iou = 0
        for p in preds:
            # calc IoU
            b1 = p['xywhn']
            b2 = g['bbox']
            inter_w = max(0.0, min(b1[0]+b1[2]/2, b2[0]+b2[2]/2) - max(b1[0]-b1[2]/2, b2[0]-b2[2]/2))
            inter_h = max(0.0, min(b1[1]+b1[3]/2, b2[1]+b2[3]/2) - max(b1[1]-b1[3]/2, b2[1]-b2[3]/2))
            inter = inter_w * inter_h
            union = b1[2]*b1[3] + b2[2]*b2[3] - inter
            iou = inter / union if union > 0 else 0
            if iou > best_iou:
                best_iou = iou
                matched_pred = p
        if matched_pred is not None and best_iou >= 0.25:
            p_cls = matched_pred['cls']
            conf_matrix[g_cls, p_cls] += 1
        else:
            # unpredicted defect -> treated as background / missed
            pass

print("Confusion Matrix (Rows: Ground Truth, Cols: Prediction):")
print("                    BeltSplice  DeepScratch  LongTear  NormalBelt  SlightScratch")
for i, row in enumerate(conf_matrix):
    print(f"{CLASS_NAMES[i]:18}  {row[0]:10}  {row[1]:11}  {row[2]:8}  {row[3]:10}  {row[4]:13}")

# Save all data to a unified tuning json
tuning_export = {
    'threshold_sweep_orig': orig_sweep,
    'threshold_sweep_v3': v3_sweep,
    'nms_sweep': nms_results,
    'size_sweep': size_results,
    'confusion_matrix': conf_matrix.tolist()
}

with open('threshold_tuning_data.json', 'w') as f:
    json.dump(tuning_export, f, indent=2)

print("\nSaved threshold_tuning_data.json successfully.")
