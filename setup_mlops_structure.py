import os
import shutil
import glob
import json
import cv2
import numpy as np
import torch
from ultralytics import YOLO

print("Setting up MLOps Model Versioning, Error Analysis Folders, and Real World Partitions...")

# 1. Models Directory Hierarchy (Phase 26)
os.makedirs("models/baseline", exist_ok=True)
os.makedirs("models/candidate", exist_ok=True)
os.makedirs("models/best", exist_ok=True)
os.makedirs("models/archived", exist_ok=True)

# Copy baseline original model if not present
if os.path.exists("detect/train/weights/best.pt") and not os.path.exists("models/baseline/original_baseline_model.pt"):
    shutil.copy2("detect/train/weights/best.pt", "models/baseline/original_baseline_model.pt")
    print("Archived baseline original model to models/baseline/original_baseline_model.pt")

# Copy candidate models
candidates = {
    "yolo11s_512_run1.pt": "13 belt_output/detect/belt_defect_yolo11s/run_512_optimized/weights/best.pt",
    "yolo11s_512_v3.pt": "run_v3_balanced/weights/best.pt",
    "yolo11s_800_v3.pt": "belt_defect_yolo11s/run_v3_balanced/weights/best.pt",
    "yolo11m_800_medium.pt": "belt_defect_yolo11m/run_800_medium-2/weights/best.pt"
}

for name, src in candidates.items():
    dest = os.path.join("models/candidate", name)
    if os.path.exists(src) and not os.path.exists(dest):
        shutil.copy2(src, dest)
        print(f"Copied candidate to {dest}")

# Best model in models/best/
if os.path.exists("models/final_sih_model.pt"):
    shutil.copy2("models/final_sih_model.pt", "models/best/final_sih_model.pt")
    print("Stored best production model in models/best/final_sih_model.pt")

# 2. Setup model_registry.json
registry = {
    "registry_version": "1.0.0",
    "project": "MineGuard AI (SIH 26008)",
    "date_updated": "2026-09-18",
    "active_production_model": "models/final_sih_model.pt",
    "models": [
        {
            "model_name": "BASELINE_ORIGINAL_MODEL (yolo11s-640)",
            "model_path": "models/baseline/original_baseline_model.pt",
            "architecture": "YOLO11s",
            "dataset_version": "Roboflow v1 (640x640)",
            "training_date": "2026-09-04",
            "classes": ["belt splice", "deep scratch", "longitudinal tear", "normal belt", "slight scratch"],
            "image_size": 640,
            "precision": 0.5359,
            "recall": 0.5242,
            "f1": 0.5044,
            "map50": 0.4354,
            "map50_95": 0.2054,
            "latency_ms": 314.8,
            "deep_scratch_recall": 0.5263,
            "real_world_recall": 0.9167,
            "status": "BASELINE"
        },
        {
            "model_name": "NEW_MODEL_1 (yolo11s-512-run1)",
            "model_path": "models/candidate/yolo11s_512_run1.pt",
            "architecture": "YOLO11s",
            "dataset_version": "Roboflow v1 (512x512)",
            "training_date": "2026-09-13",
            "classes": ["belt splice", "deep scratch", "longitudinal tear", "normal belt", "slight scratch"],
            "image_size": 512,
            "precision": 0.6141,
            "recall": 0.5826,
            "f1": 0.5577,
            "map50": 0.4880,
            "map50_95": 0.2405,
            "latency_ms": 337.3,
            "deep_scratch_recall": 0.4211,
            "real_world_recall": 0.9167,
            "status": "CANDIDATE"
        },
        {
            "model_name": "NEW_MODEL_4 (yolo11s-800-v3 / final_sih_model)",
            "model_path": "models/final_sih_model.pt",
            "architecture": "YOLO11s",
            "dataset_version": "800x800 native dataset",
            "training_date": "2026-09-13",
            "classes": ["belt splice", "deep scratch", "longitudinal tear", "normal belt", "slight scratch"],
            "image_size": 800,
            "precision": 0.6638,
            "recall": 0.5191,
            "f1": 0.5826,
            "map50": 0.4441,
            "map50_95": 0.2155,
            "latency_ms": 159.6,
            "deep_scratch_recall": 0.3158,
            "real_world_recall": 1.0000,
            "status": "BEST_PRODUCTION"
        },
        {
            "model_name": "NEW_MODEL_5 (yolo11m-800-medium)",
            "model_path": "models/candidate/yolo11m_800_medium.pt",
            "architecture": "YOLO11m",
            "dataset_version": "800x800-rr dataset",
            "training_date": "2026-09-14",
            "classes": ["belt splice", "deep scratch", "longitudinal tear", "normal belt", "slight scratch"],
            "image_size": 800,
            "precision": 0.6633,
            "recall": 0.5042,
            "f1": 0.4958,
            "map50": 0.4299,
            "map50_95": 0.2103,
            "latency_ms": 1960.0,
            "deep_scratch_recall": 0.3684,
            "real_world_recall": 0.9167,
            "status": "CANDIDATE_TOO_SLOW"
        }
    ]
}

with open("model_registry.json", "w", encoding="utf-8") as f:
    json.dump(registry, f, indent=2)
print("Saved model_registry.json successfully.")

# 3. Setup REAL_WORLD_TEST Partitions (Phase 19)
rw_dirs = [
    "REAL_WORLD_TEST/REAL_HEALTHY",
    "REAL_WORLD_TEST/REAL_BELT_SPLICE",
    "REAL_WORLD_TEST/REAL_LONGITUDINAL_TEAR",
    "REAL_WORLD_TEST/REAL_DEEP_SCRATCH",
    "REAL_WORLD_TEST/REAL_SLIGHT_SCRATCH"
]
for d in rw_dirs:
    os.makedirs(d, exist_ok=True)

# Map known ground truth files to their folders
RW_ASSIGNMENTS = {
    "REAL_WORLD_TEST/REAL_HEALTHY": [
        "frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg"
    ],
    "REAL_WORLD_TEST/REAL_BELT_SPLICE": [
        "frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg",
        "frame_00003_jpg.rf.49968cb55095c8b650a32b4de9b866a4.jpg",
        "frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg",
        "frame_00012_jpg.rf.0bccc92f2975e1b5d666489e29c08648.jpg",
        "frame_00015_jpg.rf.8130d85e915ded4d5e29721b9dda2ff3.jpg",
        "frame_00019_jpg.rf.c9d90cbe0a1e82afbccd085d19bd1cae.jpg",
        "frame_00035_jpg.rf.cfcbd4ea3415701965f8fedda293fb50.jpg"
    ],
    "REAL_WORLD_TEST/REAL_LONGITUDINAL_TEAR": [
        "frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg",
        "frame_00043_jpg.rf.18a2450e12175f4369c1a958dc52304b.jpg",
        "frame_00045_jpg.rf.1ad7ac3267692d24b90701ef60772951.jpg"
    ],
    "REAL_WORLD_TEST/REAL_DEEP_SCRATCH": [
        "frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg"
    ],
    "REAL_WORLD_TEST/REAL_SLIGHT_SCRATCH": [
        "frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg"
    ]
}

for dest_folder, file_list in RW_ASSIGNMENTS.items():
    for f in file_list:
        src = os.path.join("real_world_test", f)
        if os.path.exists(src):
            dst = os.path.join(dest_folder, f)
            if not os.path.exists(dst):
                shutil.copy2(src, dst)
print("Populated REAL_WORLD_TEST partitioned directories.")

# 4. Setup FALSE_POSITIVES and FALSE_NEGATIVES (Phase 11)
os.makedirs("FALSE_POSITIVES", exist_ok=True)
os.makedirs("FALSE_NEGATIVES", exist_ok=True)

# Copy known false positive and false negative cases from error_cases
if os.path.exists("error_cases"):
    for f in os.listdir("error_cases"):
        src = os.path.join("error_cases", f)
        if f.startswith("FP_"):
            shutil.copy2(src, os.path.join("FALSE_POSITIVES", f))
        elif f.startswith("FN_"):
            shutil.copy2(src, os.path.join("FALSE_NEGATIVES", f))
print("Populated FALSE_POSITIVES and FALSE_NEGATIVES directories.")
