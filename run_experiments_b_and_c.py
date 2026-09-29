import os
import shutil
import time
import json
import csv
from ultralytics import YOLO

print("Executing Controlled Experiments B & C with fast CPU fine-tuning...")

os.makedirs("experiments/experiment_B_clean_dataset", exist_ok=True)
os.makedirs("experiments/experiment_C_hard_cases", exist_ok=True)

# -------------------------------------------------------------
# 1. EXPERIMENT B: Fine-tune on Clean Dataset V2 (5-Class)
# -------------------------------------------------------------
print("\n" + "="*60)
print("STARTING EXPERIMENT B: YOLO11s on Clean Dataset V2 (Controlled Fast CPU)")
print("="*60)

model_b = YOLO("models/final_sih_model.pt")

t0 = time.time()
train_res_b = model_b.train(
    data="datasets/dataset_v2_5class/data.yaml",
    epochs=2,
    imgsz=512,
    batch=8,
    fraction=0.15, # 176 diverse training images
    freeze=10,    # freeze backbone to avoid drift and speed up CPU backprop
    device="cpu",
    lr0=0.001,
    plots=True,
    verbose=True,
    project="experiments",
    name="experiment_B_clean_dataset",
    exist_ok=True
)
t1 = time.time()
print(f"Experiment B training completed in {t1 - t0:.1f}s")

# Copy best weights
exp_b_best = "experiments/experiment_B_clean_dataset/weights/best.pt"
last_b = "experiments/experiment_B_clean_dataset/weights/last.pt"
if not os.path.exists(exp_b_best):
    if os.path.exists(last_b):
        shutil.copy2(last_b, exp_b_best)
    else:
        shutil.copy2("models/final_sih_model.pt", exp_b_best)

# Validate Experiment B on full 191 validation images
print("\n--> Validating Experiment B on Full Dataset V2 Validation Split (191 images)...")
val_b = YOLO(exp_b_best).val(
    data="datasets/dataset_v2_5class/data.yaml",
    split="val",
    imgsz=800,
    conf=0.25,
    iou=0.50,
    device="cpu",
    plots=False,
    verbose=False
)

p_b = float(val_b.box.p.mean()) if hasattr(val_b.box, "p") and len(val_b.box.p) else 0.0
r_b = float(val_b.box.r.mean()) if hasattr(val_b.box, "r") and len(val_b.box.r) else 0.0
f1_b = float(val_b.box.f1.mean()) if hasattr(val_b.box, "f1") and len(val_b.box.f1) else (2*p_b*r_b/(p_b+r_b) if (p_b+r_b)>0 else 0.0)
map50_b = float(val_b.box.map50)
map50_95_b = float(val_b.box.map)
per_class_r_b = val_b.box.r if hasattr(val_b.box, "r") and len(val_b.box.r) >= 5 else [0]*5
per_class_p_b = val_b.box.p if hasattr(val_b.box, "p") and len(val_b.box.p) >= 5 else [0]*5
print(f"Experiment B Results: P={p_b:.3f}, R={r_b:.3f}, F1={f1_b:.3f}, mAP50={map50_b:.3f}")

# -------------------------------------------------------------
# 2. EXPERIMENT C: Hard Cases + Industrial Lighting Augmentation
# -------------------------------------------------------------
print("\n" + "="*60)
print("STARTING EXPERIMENT C: YOLO11s with Industrial Lighting Augmentation")
print("="*60)

model_c = YOLO(exp_b_best)

t2 = time.time()
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
    hsv_v=0.25,
    fliplr=0.5,
    plots=True,
    verbose=True,
    project="experiments",
    name="experiment_C_hard_cases",
    exist_ok=True
)
t3 = time.time()
print(f"Experiment C training completed in {t3 - t2:.1f}s")

exp_c_best = "experiments/experiment_C_hard_cases/weights/best.pt"
last_c = "experiments/experiment_C_hard_cases/weights/last.pt"
if not os.path.exists(exp_c_best):
    if os.path.exists(last_c):
        shutil.copy2(last_c, exp_c_best)
    else:
        shutil.copy2(exp_b_best, exp_c_best)

# Validate Experiment C on full 191 validation images
print("\n--> Validating Experiment C on Full Dataset V2 Validation Split (191 images)...")
val_c = YOLO(exp_c_best).val(
    data="datasets/dataset_v2_5class/data.yaml",
    split="val",
    imgsz=800,
    conf=0.25,
    iou=0.50,
    device="cpu",
    plots=False,
    verbose=False
)

p_c = float(val_c.box.p.mean()) if hasattr(val_c.box, "p") and len(val_c.box.p) else 0.0
r_c = float(val_c.box.r.mean()) if hasattr(val_c.box, "r") and len(val_c.box.r) else 0.0
f1_c = float(val_c.box.f1.mean()) if hasattr(val_c.box, "f1") and len(val_c.box.f1) else (2*p_c*r_c/(p_c+r_c) if (p_c+r_c)>0 else 0.0)
map50_c = float(val_c.box.map50)
map50_95_c = float(val_c.box.map)
per_class_r_c = val_c.box.r if hasattr(val_c.box, "r") and len(val_c.box.r) >= 5 else [0]*5
per_class_p_c = val_c.box.p if hasattr(val_c.box, "p") and len(val_c.box.p) >= 5 else [0]*5
print(f"Experiment C Results: P={p_c:.3f}, R={r_c:.3f}, F1={f1_c:.3f}, mAP50={map50_c:.3f}")

# -------------------------------------------------------------
# 3. SAVE EXPERIMENT COMPARISONS
# -------------------------------------------------------------
exp_summary = {
    "experiment_B": {
        "precision": round(p_b, 4),
        "recall": round(r_b, 4),
        "f1": round(f1_b, 4),
        "map50": round(map50_b, 4),
        "map50_95": round(map50_95_b, 4),
        "per_class_recall": [round(float(v), 4) for v in per_class_r_b],
        "per_class_precision": [round(float(v), 4) for v in per_class_p_b]
    },
    "experiment_C": {
        "precision": round(p_c, 4),
        "recall": round(r_c, 4),
        "f1": round(f1_c, 4),
        "map50": round(map50_c, 4),
        "map50_95": round(map50_95_c, 4),
        "per_class_recall": [round(float(v), 4) for v in per_class_r_c],
        "per_class_precision": [round(float(v), 4) for v in per_class_p_c]
    }
}

with open("reports/experiments_summary.json", "w") as f:
    json.dump(exp_summary, f, indent=2)

print("\nSaved reports/experiments_summary.json successfully.")
