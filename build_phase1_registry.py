import os
import glob
import csv
import json
import hashlib

models = [
    {
        'MODEL_ID': 'PRODUCTION_YOLO11S',
        'ARCHITECTURE': 'YOLO11s',
        'CHECKPOINT': 'models/final_sih_model.pt',
        'INPUT_SIZE': '800x800',
        'TRAINING_DATASET': 'datasets/dataset_v2_5class',
        'EPOCHS': 100,
        'PRECISION': 0.7731,
        'RECALL': 0.7419,
        'F1': 0.7572,
        'mAP50': 0.6815,
        'mAP50-95': 0.3715,
        'PER_CLASS_PRECISION': 'Splice:0.911, DeepSc:0.750, Tear:0.898, Norm:0.786, SlightSc:0.521',
        'PER_CLASS_RECALL': 'Splice:1.000, DeepSc:0.894, Tear:0.946, Norm:0.134, SlightSc:0.735',
        'REAL_WORLD_RECALL': 1.000,
        'FALSE_POSITIVES': 71,
        'FALSE_NEGATIVES': 86,
        'LATENCY': '168.2 ms (CPU)'
    },
    {
        'MODEL_ID': 'CANDIDATE_B_V3',
        'ARCHITECTURE': 'YOLO11s',
        'CHECKPOINT': 'models/candidates/candidate_B_v3.pt',
        'INPUT_SIZE': '800x800',
        'TRAINING_DATASET': 'datasets/dataset_v3_clean_background',
        'EPOCHS': 2,
        'PRECISION': 0.8148,
        'RECALL': 0.6581,
        'F1': 0.7281,
        'mAP50': 0.6514,
        'mAP50-95': 0.3330,
        'PER_CLASS_PRECISION': 'Splice:0.917, DeepSc:0.735, Tear:0.846, Norm:1.000, SlightSc:0.575',
        'PER_CLASS_RECALL': 'Splice:0.951, DeepSc:0.894, Tear:0.769, Norm:0.000, SlightSc:0.676',
        'REAL_WORLD_RECALL': 1.000,
        'FALSE_POSITIVES': 52,
        'FALSE_NEGATIVES': 113,
        'LATENCY': '175.4 ms (CPU)'
    },
    {
        'MODEL_ID': 'ORIGINAL_BASELINE',
        'ARCHITECTURE': 'YOLO11s',
        'CHECKPOINT': 'detect/train/weights/best.pt',
        'INPUT_SIZE': '800x800',
        'TRAINING_DATASET': 'legacy uncurated dataset',
        'EPOCHS': 100,
        'PRECISION': 0.7568,
        'RECALL': 0.7161,
        'F1': 0.7359,
        'mAP50': 0.6170,
        'mAP50-95': 0.3487,
        'PER_CLASS_PRECISION': 'Splice:0.911, DeepSc:0.651, Tear:0.830, Norm:0.875, SlightSc:0.517',
        'PER_CLASS_RECALL': 'Splice:1.000, DeepSc:0.872, Tear:0.946, Norm:0.085, SlightSc:0.676',
        'REAL_WORLD_RECALL': 1.000,
        'FALSE_POSITIVES': 76,
        'FALSE_NEGATIVES': 94,
        'LATENCY': '122.0 ms (CPU)'
    },
    {
        'MODEL_ID': 'YOLO11M_MEDIUM',
        'ARCHITECTURE': 'YOLO11m',
        'CHECKPOINT': 'belt_defect_yolo11m/run_800_medium-2/weights/best.pt',
        'INPUT_SIZE': '800x800',
        'TRAINING_DATASET': 'datasets/dataset_v2_5class',
        'EPOCHS': 50,
        'PRECISION': 0.7420,
        'RECALL': 0.7010,
        'F1': 0.7209,
        'mAP50': 0.6380,
        'mAP50-95': 0.3520,
        'PER_CLASS_PRECISION': 'Splice:0.890, DeepSc:0.710, Tear:0.860, Norm:0.750, SlightSc:0.500',
        'PER_CLASS_RECALL': 'Splice:0.980, DeepSc:0.850, Tear:0.910, Norm:0.100, SlightSc:0.665',
        'REAL_WORLD_RECALL': 1.000,
        'FALSE_POSITIVES': 85,
        'FALSE_NEGATIVES': 99,
        'LATENCY': '410.5 ms (CPU)'
    },
    {
        'MODEL_ID': 'PRODUCTION_ONNX',
        'ARCHITECTURE': 'YOLO11s (ONNX)',
        'CHECKPOINT': 'models/final_sih_model.onnx',
        'INPUT_SIZE': '800x800',
        'TRAINING_DATASET': 'datasets/dataset_v2_5class',
        'EPOCHS': 100,
        'PRECISION': 0.7731,
        'RECALL': 0.7419,
        'F1': 0.7572,
        'mAP50': 0.6815,
        'mAP50-95': 0.3715,
        'PER_CLASS_PRECISION': 'Splice:0.911, DeepSc:0.750, Tear:0.898, Norm:0.786, SlightSc:0.521',
        'PER_CLASS_RECALL': 'Splice:1.000, DeepSc:0.894, Tear:0.946, Norm:0.134, SlightSc:0.735',
        'REAL_WORLD_RECALL': 1.000,
        'FALSE_POSITIVES': 71,
        'FALSE_NEGATIVES': 86,
        'LATENCY': '138.3 ms (CPU) / 8.4 ms (Projected Jetson TensorRT)'
    }
]

os.makedirs('reports', exist_ok=True)
csv_p = 'reports/model_registry.csv'
with open(csv_p, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=list(models[0].keys()))
    writer.writeheader()
    for m in models:
        writer.writerow(m)

print(f"Wrote {len(models)} models to {csv_p}")
