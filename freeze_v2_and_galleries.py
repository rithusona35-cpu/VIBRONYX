import os
import shutil
import json

print("Populating galleries and creating final model v2 freeze artifacts...")

os.makedirs("reports/false_negative_gallery", exist_ok=True)
os.makedirs("reports/false_positive_gallery", exist_ok=True)

# Copy gallery images
for f in ["error_cases/FN_frame_00011_jpg.rf.19efdc8a690a0280e957f97f70f5a9fa.jpg",
          "error_cases/FN_frame_00031_jpg.rf.c1d1dde1b4c3e2dd897c4b21adb8986d.jpg"]:
    if os.path.exists(f):
        shutil.copy2(f, os.path.join("reports/false_negative_gallery", os.path.basename(f)))

for f in ["error_cases/FP_frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg",
          "error_cases/FP_frame_00006_jpg.rf.b87689121ddd3d4a993e9166cab21dd1.jpg"]:
    if os.path.exists(f):
        shutil.copy2(f, os.path.join("reports/false_positive_gallery", os.path.basename(f)))

# Phase 29: Freeze final_sih_model_v2.pt
best_v2_candidate = "experiments/experiment_C_hard_cases/best.pt"
if os.path.exists(best_v2_candidate):
    shutil.copy2(best_v2_candidate, "models/final_sih_model_v2.pt")
    print("Stored candidate model in models/final_sih_model_v2.pt")

v2_metadata = {
    "model_name": "final_sih_model_v2.pt",
    "evaluation_decision": "MAINTAIN_V1_IN_PRODUCTION",
    "reason": "Current production model final_sih_model.pt achieved superior empirical validation metrics (68.15% mAP50, 77.31% precision, 74.19% recall, 89.36% deep scratch recall, 0% healthy false alarm rate) compared to Experiment C (60.05% mAP50, 70.19% precision, 66.21% recall). In adherence to non-destructive safety rules, v1 remains active in production.",
    "architecture": "YOLO11s",
    "parameters": "9.41M",
    "image_size": 800,
    "confidence_threshold": 0.25,
    "nms_iou": 0.50,
    "dataset_version": "datasets/dataset_v2_5class",
    "metrics_comparison": {
        "production_v1": {
            "mAP50": 0.6815,
            "mAP50_95": 0.3715,
            "precision": 0.7731,
            "recall": 0.7419,
            "f1": 0.7572,
            "deep_scratch_recall": 0.8936,
            "longitudinal_tear_recall": 0.9462,
            "belt_splice_recall": 1.0000,
            "slight_scratch_recall": 0.7353,
            "real_world_defect_recall": 1.0000,
            "real_world_healthy_false_alarm_rate": 0.0000
        },
        "experiment_C_v2": {
            "mAP50": 0.6005,
            "mAP50_95": 0.3331,
            "precision": 0.7019,
            "recall": 0.6621,
            "f1": 0.6814,
            "deep_scratch_recall": 0.6170,
            "longitudinal_tear_recall": 0.8925,
            "belt_splice_recall": 1.0000,
            "slight_scratch_recall": 0.6912,
            "real_world_defect_recall": 1.0000,
            "real_world_healthy_false_alarm_rate": 1.0000
        }
    },
    "date_evaluated": "2026-09-18"
}

with open("models/final_sih_model_v2_metadata.json", "w", encoding="utf-8") as f:
    json.dump(v2_metadata, f, indent=2)

print("Saved models/final_sih_model_v2_metadata.json successfully.")
