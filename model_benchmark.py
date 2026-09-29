"""
MineGuard AI — Automated Model Discovery, Benchmarking & Selection Engine
SIH 26008: Conveyor Belt Defect Detection & Monitoring
"""

import os
import glob
import time
import json
import csv
import cv2
import numpy as np
import torch
from ultralytics import YOLO

DATASET_YAML = "dataset.yaml"
OUTPUT_CSV = "MODEL_COMPARISON.csv"
CONF_MATRIX_JSON = "confusion_matrix_benchmark.json"

CLASS_NAMES = {0: 'Belt Splice', 1: 'Deep Scratch', 2: 'Longitudinal Tear', 3: 'Normal Belt', 4: 'Slight Scratch'}
CLASS_COLORS = {
    0: (0, 165, 255),   # Orange: Belt Splice
    1: (0, 0, 255),     # Red: Deep Scratch
    2: (255, 0, 0),     # Blue: Longitudinal Tear
    3: (0, 255, 0),     # Green: Normal Belt
    4: (0, 255, 255)    # Yellow: Slight Scratch
}

def discover_checkpoints():
    """Recursively finds all unique .pt checkpoints across candidate and model dirs."""
    discovered = []
    seen_paths = set()
    search_dirs = ['models', 'detect', 'run_v3_balanced', 'belt_output', 'belt_defect_yolo11s', 'belt_defect_yolo11m']
    for sdir in search_dirs:
        if os.path.exists(sdir):
            for p in glob.glob(os.path.join(sdir, '**', '*.pt'), recursive=True):
                norm = os.path.normpath(p)
                if 'last.pt' not in norm and 'epoch' not in norm and 'venv' not in norm:
                    if norm not in seen_paths:
                        seen_paths.add(norm)
                        discovered.append(norm)
    return sorted(discovered)

def run_benchmark(checkpoint_paths, test_yaml=DATASET_YAML):
    print(f"Discovered {len(checkpoint_paths)} checkpoint candidates for objective benchmarking:")
    for cp in checkpoint_paths:
        print(f"  - {cp}")
        
    benchmark_records = []
    
    for ckpt in checkpoint_paths:
        print(f"\nEvaluating: {ckpt}")
        size_mb = round(os.path.getsize(ckpt) / (1024 * 1024), 2)
        
        try:
            model = YOLO(ckpt)
            
            # Determine appropriate imgsz from args or default
            train_args = getattr(model, 'overrides', {}) or {}
            imgsz = train_args.get('imgsz', 800)
            if '640' in ckpt or 'detect/train' in ckpt.replace('\\', '/'):
                imgsz = 640
            elif '512' in ckpt:
                imgsz = 512
                
            t0 = time.time()
            val_res = model.val(data=test_yaml, split='test', imgsz=imgsz, conf=0.25, iou=0.5, device='cpu', plots=False, verbose=False)
            t1 = time.time()
            
            p = float(val_res.box.p.mean()) if hasattr(val_res.box, 'p') and len(val_res.box.p) else 0.0
            r = float(val_res.box.r.mean()) if hasattr(val_res.box, 'r') and len(val_res.box.r) else 0.0
            f1 = float(val_res.box.f1.mean()) if hasattr(val_res.box, 'f1') and len(val_res.box.f1) else (2*p*r/(p+r) if (p+r)>0 else 0.0)
            map50 = float(val_res.box.map50)
            map50_95 = float(val_res.box.map)
            
            per_class_r = val_res.box.r if hasattr(val_res.box, 'r') and len(val_res.box.r) >= 5 else [0]*5
            per_class_p = val_res.box.p if hasattr(val_res.box, 'p') and len(val_res.box.p) >= 5 else [0]*5
            
            # Real-world benchmark on 12 images
            rw_files = sorted(glob.glob('real_world_test/*.jpg'))
            rw_correct = 0
            latencies = []
            for rwf in rw_files:
                t_start = time.time()
                res = model.predict(source=rwf, imgsz=imgsz, conf=0.25, iou=0.45, device='cpu', verbose=False)[0]
                latencies.append((time.time() - t_start) * 1000)
                boxes = res.boxes
                det_classes = [int(b.cls[0].item()) for b in boxes] if boxes is not None and len(boxes)>0 else []
                defects = [c for c in det_classes if c != 3]
                is_clean = ('frame_00021' in rwf)
                if (is_clean and len(defects) == 0) or (not is_clean and len(defects) > 0):
                    rw_correct += 1
                    
            rw_recall = round(rw_correct / len(rw_files), 4) if rw_files else 0.0
            avg_lat = round(np.mean(latencies), 1) if latencies else 0.0
            
            record = {
                'model_path': ckpt,
                'model_name': os.path.basename(ckpt),
                'precision': round(p, 4),
                'recall': round(r, 4),
                'f1': round(f1, 4),
                'map50': round(map50, 4),
                'map50_95': round(map50_95, 4),
                'belt_splice_recall': round(float(per_class_r[0]), 4),
                'deep_scratch_recall': round(float(per_class_r[1]), 4),
                'longitudinal_tear_recall': round(float(per_class_r[2]), 4),
                'normal_belt_precision': round(float(per_class_p[3]), 4),
                'slight_scratch_recall': round(float(per_class_r[4]), 4),
                'real_world_recall': rw_recall,
                'latency_ms': avg_lat,
                'size_mb': size_mb
            }
            benchmark_records.append(record)
            print(f" -> P={p:.3f}, R={r:.3f}, mAP50={map50:.3f}, RealWorld={rw_recall:.3f}, Latency={avg_lat}ms")
            
        except Exception as e:
            print(f"Failed to benchmark {ckpt}: {e}")
            
    # Save CSV
    if benchmark_records:
        keys = list(benchmark_records[0].keys())
        with open("AUTOMATED_MODEL_BENCHMARK.csv", "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=keys)
            writer.writeheader()
            for r in benchmark_records:
                writer.writerow(r)
        print("\nSaved AUTOMATED_MODEL_BENCHMARK.csv successfully.")
        
        # Determine best candidate
        # Scoring function: 0.4*real_world_recall + 0.3*map50 + 0.2*recall + 0.1*precision
        def score(r):
            return 0.4*r['real_world_recall'] + 0.3*r['map50'] + 0.2*r['recall'] + 0.1*r['precision']
            
        best = max(benchmark_records, key=score)
        print("="*60)
        print(f"🏆 BEST MODEL SELECTED: {best['model_path']}")
        print(f"   mAP50: {best['map50']}, Real-World Recall: {best['real_world_recall']}, Latency: {best['latency_ms']} ms")
        print("="*60)
        return best
    return None

if __name__ == "__main__":
    checkpoints = discover_checkpoints()
    run_benchmark(checkpoints)
