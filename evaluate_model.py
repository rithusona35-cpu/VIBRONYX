import os
import pandas as pd
import numpy as np
from ultralytics import YOLO

MODEL_PATH = "c:/Users/AnbuRithu/Downloads/yolo_output/belt_defect_yolo11s/run_v3_balanced/weights/best.pt"
DATA_YAML = "d:/SIH/anband told/data.yaml"

print(f"Loading Model for Test Evaluation: {MODEL_PATH}")
model = YOLO(MODEL_PATH)

print(f"Evaluating on Test Split from: {DATA_YAML}")
metrics = model.val(data=DATA_YAML, split='test', imgsz=800, batch=16, conf=0.25, iou=0.45, plots=True)

# Extract Overall Metrics
overall_p = metrics.box.mp
overall_r = metrics.box.mr
overall_map50 = metrics.box.map50
overall_map = metrics.box.map

print("\n=== OVERALL TEST EVALUATION METRICS ===")
print(f"Precision (P)    : {overall_p*100:.2f}%")
print(f"Recall (R)       : {overall_r*100:.2f}%")
print(f"mAP@50           : {overall_map50*100:.2f}%")
print(f"mAP@50-95        : {overall_map*100:.2f}%")

# Extract Per-Class Metrics
# Ultralytics metrics.box.maps contains AP50-95 per class, metrics.box.ap50 contains AP50 per class
per_class_rows = []
names = model.names

for i, class_name in names.items():
    ap50 = metrics.box.ap50[i] if i < len(metrics.box.ap50) else 0.0
    ap = metrics.box.ap[i] if i < len(metrics.box.ap) else 0.0
    p = metrics.box.p[i] if hasattr(metrics.box, 'p') and i < len(metrics.box.p) else 0.0
    r = metrics.box.r[i] if hasattr(metrics.box, 'r') and i < len(metrics.box.r) else 0.0
    f1 = metrics.box.f1[i] if hasattr(metrics.box, 'f1') and i < len(metrics.box.f1) else 0.0
    
    per_class_rows.append({
        "class_id": i,
        "class_name": class_name,
        "precision": round(float(p), 4),
        "recall": round(float(r), 4),
        "f1_score": round(float(f1), 4),
        "ap50": round(float(ap50), 4),
        "ap50_95": round(float(ap), 4)
    })

df_per_class = pd.DataFrame(per_class_rows)
df_per_class.to_csv("per_class_metrics.csv", index=False)
print("\n=== PER-CLASS TEST METRICS ===")
print(df_per_class.to_string())
print("\nWrote per_class_metrics.csv")
