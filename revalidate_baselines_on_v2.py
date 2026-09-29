import os
import csv
import time
from ultralytics import YOLO

print("Executing Phase 12: Revalidating Baseline & Production Models on Clean Leakage-Free Dataset V2...")

DATASET_YAML = "datasets/dataset_v2_5class/data.yaml"

models_to_test = [
    {
        "id": "BASELINE_ORIGINAL_MODEL",
        "name": "Original YOLO11s-640 (detect/train/weights/best.pt)",
        "path": "detect/train/weights/best.pt",
        "imgsz": 640
    },
    {
        "id": "CURRENT_PRODUCTION_MODEL",
        "name": "Current Production YOLO11s-800 (models/final_sih_model.pt)",
        "path": "models/final_sih_model.pt",
        "imgsz": 800
    }
]

reval_rows = []

for m in models_to_test:
    print(f"\n--> Revalidating {m['name']} on Dataset V2 (Leakage-Free Val Split: 191 images)...")
    model = YOLO(m["path"])
    
    # 1. Validation Split
    t0 = time.time()
    val_res = model.val(data=DATASET_YAML, split="val", imgsz=m["imgsz"], conf=0.25, iou=0.50, device="cpu", plots=False, verbose=False)
    t1 = time.time()
    
    p = float(val_res.box.p.mean()) if hasattr(val_res.box, "p") and len(val_res.box.p) else 0.0
    r = float(val_res.box.r.mean()) if hasattr(val_res.box, "r") and len(val_res.box.r) else 0.0
    f1 = float(val_res.box.f1.mean()) if hasattr(val_res.box, "f1") and len(val_res.box.f1) else (2*p*r/(p+r) if (p+r)>0 else 0.0)
    map50 = float(val_res.box.map50)
    map50_95 = float(val_res.box.map)
    
    per_class_r = val_res.box.r if hasattr(val_res.box, "r") and len(val_res.box.r) >= 5 else [0]*5
    per_class_p = val_res.box.p if hasattr(val_res.box, "p") and len(val_res.box.p) >= 5 else [0]*5
    
    lat = round((t1 - t0) / 191 * 1000, 1)
    
    row = {
        "model": m["id"],
        "dataset": "dataset_v2_5class_val",
        "split": "val (191 imgs)",
        "precision": round(p, 4),
        "recall": round(r, 4),
        "f1": round(f1, 4),
        "map50": round(map50, 4),
        "map50_95": round(map50_95, 4),
        "belt_splice_recall": round(float(per_class_r[0]), 4),
        "deep_scratch_recall": round(float(per_class_r[1]), 4),
        "longitudinal_tear_recall": round(float(per_class_r[2]), 4),
        "normal_belt_precision": round(float(per_class_p[3]), 4),
        "slight_scratch_recall": round(float(per_class_r[4]), 4),
        "latency_ms": lat
    }
    reval_rows.append(row)
    print(f"VAL RESULT: P={p:.3f}, R={r:.3f}, F1={f1:.3f}, mAP50={map50:.3f}, Latency={lat}ms")

# Save reports/baseline_revalidation.csv
csv_fields = list(reval_rows[0].keys())
with open("reports/baseline_revalidation.csv", "w", newline="", encoding="utf-8") as f:
    writer = csv.DictWriter(f, fieldnames=csv_fields)
    writer.writeheader()
    for row in reval_rows:
        writer.writerow(row)

print("\nSaved reports/baseline_revalidation.csv successfully.")
