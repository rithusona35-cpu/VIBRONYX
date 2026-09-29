import os
import glob
import time
import json
import csv
import cv2
import numpy as np
import torch
from ultralytics import YOLO

# 1. Model Definitions
MODELS = [
    {
        'id': 'BASELINE_ORIGINAL_MODEL',
        'name': 'YOLO11s-Original-640 (detect/train)',
        'path': 'detect/train/weights/best.pt',
        'imgsz': 640
    },
    {
        'id': 'NEW_MODEL_1',
        'name': 'YOLO11s-512-Run1 (13 belt_output)',
        'path': '13 belt_output/detect/belt_defect_yolo11s/run_512_optimized/weights/best.pt',
        'imgsz': 512
    },
    {
        'id': 'NEW_MODEL_2',
        'name': 'YOLO11s-512-v3 (run_v3_balanced)',
        'path': 'run_v3_balanced/weights/best.pt',
        'imgsz': 512
    },
    {
        'id': 'NEW_MODEL_3',
        'name': 'YOLO11s-512-800data (belt_output)',
        'path': 'belt_output/detect/belt_defect_yolo11s/run_v3_balanced/weights/best.pt',
        'imgsz': 512
    },
    {
        'id': 'NEW_MODEL_4',
        'name': 'YOLO11s-800-v3 (belt_defect_yolo11s / best_model.pt)',
        'path': 'belt_defect_yolo11s/run_v3_balanced/weights/best.pt',
        'imgsz': 800
    },
    {
        'id': 'NEW_MODEL_5',
        'name': 'YOLO11m-800-Medium (belt_defect_yolo11m)',
        'path': 'belt_defect_yolo11m/run_800_medium-2/weights/best.pt',
        'imgsz': 800
    }
]

CLASS_NAMES = {0: 'Belt Splice', 1: 'Deep Scratch', 2: 'Longitudinal Tear', 3: 'Normal Belt', 4: 'Slight Scratch'}
CLASS_COLORS = {
    0: (0, 165, 255),   # Orange: Belt Splice
    1: (0, 0, 255),     # Red: Deep Scratch
    2: (255, 0, 0),     # Blue: Longitudinal Tear
    3: (0, 255, 0),     # Green: Normal Belt
    4: (0, 255, 255)    # Yellow: Slight Scratch
}

# Ground truth for 12 real-world images
REAL_WORLD_GT = {
    'frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg': {'has_defect': True, 'classes': [0, 2]},
    'frame_00003_jpg.rf.49968cb55095c8b650a32b4de9b866a4.jpg': {'has_defect': True, 'classes': [0, 2]},
    'frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg': {'has_defect': True, 'classes': [0, 2, 4]},
    'frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg': {'has_defect': True, 'classes': [2]},
    'frame_00012_jpg.rf.0bccc92f2975e1b5d666489e29c08648.jpg': {'has_defect': True, 'classes': [0]},
    'frame_00015_jpg.rf.8130d85e915ded4d5e29721b9dda2ff3.jpg': {'has_defect': True, 'classes': [0]},
    'frame_00019_jpg.rf.c9d90cbe0a1e82afbccd085d19bd1cae.jpg': {'has_defect': True, 'classes': [0, 2]},
    'frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg': {'has_defect': False, 'classes': [3]},
    'frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg': {'has_defect': True, 'classes': [1, 2, 4]},
    'frame_00035_jpg.rf.cfcbd4ea3415701965f8fedda293fb50.jpg': {'has_defect': True, 'classes': [0]},
    'frame_00043_jpg.rf.18a2450e12175f4369c1a958dc52304b.jpg': {'has_defect': True, 'classes': [2]},
    'frame_00045_jpg.rf.1ad7ac3267692d24b90701ef60772951.jpg': {'has_defect': True, 'classes': [2]}
}

os.makedirs('real_world_predictions', exist_ok=True)
os.makedirs('final_visual_results', exist_ok=True)
os.makedirs('hard_cases', exist_ok=True)

print("="*70)
print("STARTING COMPLETE SCIENTIFIC MODEL EVALUATION")
print("="*70)

# Evaluate each model on test dataset (71 images)
results = []
for m in MODELS:
    print(f"\n---> Evaluating {m['id']}: {m['name']} (Path: {m['path']})")
    size_mb = round(os.path.getsize(m['path']) / (1024 * 1024), 1)
    
    yolo_model = YOLO(m['path'])
    
    # 1. Benchmark on Test split using standardized val()
    t0 = time.time()
    val_res = yolo_model.val(data='dataset.yaml', split='test', imgsz=m['imgsz'], conf=0.25, iou=0.5, device='cpu', plots=False, verbose=False)
    t1 = time.time()
    
    p = float(val_res.box.p.mean()) if hasattr(val_res.box, 'p') and len(val_res.box.p) else 0.0
    r = float(val_res.box.r.mean()) if hasattr(val_res.box, 'r') and len(val_res.box.r) else 0.0
    f1 = float(val_res.box.f1.mean()) if hasattr(val_res.box, 'f1') and len(val_res.box.f1) else (2*p*r/(p+r) if (p+r)>0 else 0.0)
    map50 = float(val_res.box.map50)
    map50_95 = float(val_res.box.map)
    
    # Per-class metrics
    per_class_r = val_res.box.r if hasattr(val_res.box, 'r') and len(val_res.box.r) >= 5 else [0]*5
    per_class_p = val_res.box.p if hasattr(val_res.box, 'p') and len(val_res.box.p) >= 5 else [0]*5
    
    belt_splice_r = float(per_class_r[0])
    deep_scratch_r = float(per_class_r[1])
    tear_r = float(per_class_r[2])
    normal_p = float(per_class_p[3])
    slight_scratch_r = float(per_class_r[4])
    
    fpr = round(1.0 - p, 4) if p > 0 else 0.0
    fnr = round(1.0 - r, 4) if r > 0 else 0.0
    
    # Measure latency on 12 real-world test images
    rw_files = sorted(glob.glob('real_world_test/*.jpg'))
    rw_correct = 0
    rw_total = len(rw_files)
    latencies = []
    
    for fpath in rw_files:
        fname = os.path.basename(fpath)
        gt = REAL_WORLD_GT.get(fname, {'has_defect': True, 'classes': []})
        
        t_start = time.time()
        preds = yolo_model.predict(source=fpath, imgsz=m['imgsz'], conf=0.25, iou=0.45, device='cpu', verbose=False)[0]
        t_end = time.time()
        latencies.append((t_end - t_start) * 1000.0)
        
        # Analyze predictions
        boxes = preds.boxes
        detected_classes = [int(c) for c in boxes.cls.tolist()] if boxes is not None and len(boxes) > 0 else []
        defect_classes = [c for c in detected_classes if c != 3] # non-normal
        has_defect_pred = len(defect_classes) > 0
        
        # Check correctness: defect detected when defect exists, or no defect / normal when clean
        if gt['has_defect'] == has_defect_pred:
            rw_correct += 1
        else:
            # High-value failure case
            hard_case_info = {
                'image': fname,
                'ground_truth': 'DEFECT' if gt['has_defect'] else 'NORMAL',
                'prediction': 'NORMAL' if not has_defect_pred else 'DEFECT',
                'classes_pred': [CLASS_NAMES.get(c, str(c)) for c in detected_classes],
                'model': m['name']
            }
            with open(f"hard_cases/fail_{m['id']}_{fname}.json", 'w') as hf:
                json.dump(hard_case_info, hf, indent=2)
                
        # If this is the original or final model, save prediction overlay
        if m['id'] in ['BASELINE_ORIGINAL_MODEL', 'NEW_MODEL_4']:
            img_bgr = cv2.imread(fpath)
            for box in boxes:
                cls_id = int(box.cls[0].item())
                conf_val = float(box.conf[0].item())
                xyxy = [int(v) for v in box.xyxy[0].tolist()]
                color = CLASS_COLORS.get(cls_id, (0, 255, 0))
                cname = CLASS_NAMES.get(cls_id, f"Class {cls_id}")
                cv2.rectangle(img_bgr, (xyxy[0], xyxy[1]), (xyxy[2], xyxy[3]), color, 2)
                label = f"{cname} {conf_val*100:.1f}%"
                cv2.putText(img_bgr, label, (xyxy[0], max(xyxy[1]-6, 15)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
            out_name = f"real_world_predictions/{m['id']}_{fname}"
            cv2.imwrite(out_name, img_bgr)
            if m['id'] == 'NEW_MODEL_4':
                cv2.imwrite(f"final_visual_results/{fname}", img_bgr)
                
    rw_recall = round(rw_correct / rw_total, 4) if rw_total > 0 else 0.0
    avg_latency = round(np.mean(latencies), 1)
    
    row = {
        'Model': m['id'],
        'Precision': round(p, 4),
        'Recall': round(r, 4),
        'F1': round(f1, 4),
        'mAP50': round(map50, 4),
        'mAP50-95': round(map50_95, 4),
        'Belt_Splice_Recall': round(belt_splice_r, 4),
        'Deep_Scratch_Recall': round(deep_scratch_r, 4),
        'Longitudinal_Tear_Recall': round(tear_r, 4),
        'Slight_Scratch_Recall': round(slight_scratch_r, 4),
        'Normal_Belt_Precision': round(normal_p, 4),
        'False_Positive_Rate': fpr,
        'False_Negative_Rate': fnr,
        'Real_World_Recall': rw_recall,
        'Average_Latency': avg_latency,
        'Model_Size': f"{size_mb} MB"
    }
    results.append(row)
    print(f"Results for {m['id']}: P={p:.3f}, R={r:.3f}, F1={f1:.3f}, mAP50={map50:.3f}, RW_Acc={rw_recall:.3f}, Latency={avg_latency}ms")

# Save MODEL_COMPARISON.csv
csv_cols = [
    'Model', 'Precision', 'Recall', 'F1', 'mAP50', 'mAP50-95',
    'Belt_Splice_Recall', 'Deep_Scratch_Recall', 'Longitudinal_Tear_Recall',
    'Slight_Scratch_Recall', 'Normal_Belt_Precision', 'False_Positive_Rate',
    'False_Negative_Rate', 'Real_World_Recall', 'Average_Latency', 'Model_Size'
]

with open('MODEL_COMPARISON.csv', 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=csv_cols)
    writer.writeheader()
    for r in results:
        writer.writerow(r)

print("\nSaved MODEL_COMPARISON.csv successfully!")
