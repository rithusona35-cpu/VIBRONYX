import os
import shutil
import time
import json
from ultralytics import YOLO

print("Executing Phase 15: Experiment C (Hard Cases + Industrial Lighting Augmentation)...")

os.makedirs("experiments/experiment_B_clean_dataset", exist_ok=True)
os.makedirs("experiments/experiment_C_hard_cases", exist_ok=True)

# Copy best of B to experiments/experiment_B_clean_dataset/best.pt
exp_b_src = "runs/detect/experiments/experiment_B_clean_dataset/weights/best.pt"
exp_b_dst = "experiments/experiment_B_clean_dataset/best.pt"
shutil.copy2(exp_b_src, exp_b_dst)
print(f"Copied Experiment B best model to {exp_b_dst}")

# Validate Experiment B at native 800px on full 191 val images
print("\n--> Validating Experiment B at 800px on full 191 val images...")
val_b = YOLO(exp_b_dst).val(
    data="datasets/dataset_v2_5class/data.yaml",
    split="val",
    imgsz=800,
    conf=0.25,
    iou=0.50,
    device="cpu",
    plots=False,
    verbose=False
)

p_b = float(val_b.box.p.mean())
r_b = float(val_b.box.r.mean())
f1_b = 2 * p_b * r_b / (p_b + r_b) if (p_b + r_b) > 0 else 0.0
map50_b = float(val_b.box.map50)
map50_95_b = float(val_b.box.map)
per_class_r_b = [float(v) for v in val_b.box.r] if hasattr(val_b.box, "r") and len(val_b.box.r) >= 5 else [0]*5
per_class_p_b = [float(v) for v in val_b.box.p] if hasattr(val_b.box, "p") and len(val_b.box.p) >= 5 else [0]*5
print(f"Experiment B (800px Val): P={p_b:.3f}, R={r_b:.3f}, F1={f1_b:.3f}, mAP50={map50_b:.3f}")

# Train Experiment C
print("\n" + "="*60)
print("TRAINING EXPERIMENT C: Lighting Augmentation (Brightness +-25%, Saturation, Flips)")
print("="*60)

model_c = YOLO(exp_b_dst)

t0 = time.time()
train_res_c = model_c.train(
    data="datasets/dataset_v2_5class/data.yaml",
    epochs=2,
    imgsz=512,
    batch=8,
    fraction=0.15,
    freeze=10,
    device="cpu",
    lr0=0.0005,
    hsv_h=0.015,
    hsv_s=0.4,
    hsv_v=0.25, # brightness +-25%
    fliplr=0.5, # horizontal flips
    plots=True,
    verbose=True,
    project="experiments",
    name="experiment_C_hard_cases",
    exist_ok=True
)
t1 = time.time()
print(f"Experiment C training completed in {t1 - t0:.1f}s")

# Resolve best of C
exp_c_src = "runs/detect/experiments/experiment_C_hard_cases/weights/best.pt"
exp_c_dst = "experiments/experiment_C_hard_cases/best.pt"
if os.path.exists(exp_c_src):
    shutil.copy2(exp_c_src, exp_c_dst)
else:
    shutil.copy2("runs/detect/experiments/experiment_C_hard_cases/weights/last.pt", exp_c_dst)
print(f"Copied Experiment C best model to {exp_c_dst}")

# Validate Experiment C at native 800px on full 191 val images
print("\n--> Validating Experiment C at 800px on full 191 val images...")
val_c = YOLO(exp_c_dst).val(
    data="datasets/dataset_v2_5class/data.yaml",
    split="val",
    imgsz=800,
    conf=0.25,
    iou=0.50,
    device="cpu",
    plots=False,
    verbose=False
)

p_c = float(val_c.box.p.mean())
r_c = float(val_c.box.r.mean())
f1_c = 2 * p_c * r_c / (p_c + r_c) if (p_c + r_c) > 0 else 0.0
map50_c = float(val_c.box.map50)
map50_95_c = float(val_c.box.map)
per_class_r_c = [float(v) for v in val_c.box.r] if hasattr(val_c.box, "r") and len(val_c.box.r) >= 5 else [0]*5
per_class_p_c = [float(v) for v in val_c.box.p] if hasattr(val_c.box, "p") and len(val_c.box.p) >= 5 else [0]*5
print(f"Experiment C (800px Val): P={p_c:.3f}, R={r_c:.3f}, F1={f1_c:.3f}, mAP50={map50_c:.3f}")

# Save experiment summary
summary = {
    "experiment_B": {
        "precision": round(p_b, 4),
        "recall": round(r_b, 4),
        "f1": round(f1_b, 4),
        "map50": round(map50_b, 4),
        "map50_95": round(map50_95_b, 4),
        "per_class_recall": [round(v, 4) for v in per_class_r_b],
        "per_class_precision": [round(v, 4) for v in per_class_p_b]
    },
    "experiment_C": {
        "precision": round(p_c, 4),
        "recall": round(r_c, 4),
        "f1": round(f1_c, 4),
        "map50": round(map50_c, 4),
        "map50_95": round(map50_95_c, 4),
        "per_class_recall": [round(v, 4) for v in per_class_r_c],
        "per_class_precision": [round(v, 4) for v in per_class_p_c]
    }
}

with open("reports/experiments_summary.json", "w", encoding="utf-8") as f:
    json.dump(summary, f, indent=2)

print("\nSaved reports/experiments_summary.json successfully.")
