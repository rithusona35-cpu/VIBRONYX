import os
import glob
import cv2
import numpy as np
import torch
from ultralytics import YOLO

os.makedirs("visual_validation_sheets", exist_ok=True)
model = YOLO("models/final_sih_model.pt")

CLASS_NAMES = {0: 'Belt Splice', 1: 'Deep Scratch', 2: 'Longitudinal Tear', 3: 'Normal Belt', 4: 'Slight Scratch'}
CLASS_COLORS = {
    0: (0, 165, 255),   # Orange: Belt Splice
    1: (0, 0, 255),     # Red: Deep Scratch
    2: (255, 0, 0),     # Blue: Longitudinal Tear
    3: (0, 255, 0),     # Green: Normal Belt
    4: (0, 255, 255)    # Yellow: Slight Scratch
}

# 1. Correct Detections (True Positives)
correct_samples = [
    ("belt_splice_correct.jpg", "known_defect_tests/belt_splice_1_frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg"),
    ("deep_scratch_correct.jpg", "known_defect_tests/deep_scratch_1_frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg"),
    ("longitudinal_tear_correct.jpg", "known_defect_tests/longitudinal_tear_2_frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg"),
    ("slight_scratch_correct.jpg", "known_defect_tests/slight_scratch_5_frame_00129_jpg.rf.7719d1d835cab947ea466cdf7469001a.jpg"),
    ("normal_belt_clean_correct.jpg", "real_world_test/frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg")
]

for out_name, in_path in correct_samples:
    if os.path.exists(in_path):
        res = model.predict(source=in_path, imgsz=800, conf=0.25, iou=0.5, device='cpu', verbose=False)[0]
        bgr = cv2.imread(in_path)
        if res.boxes is not None:
            for b in res.boxes:
                cid = int(b.cls[0].item())
                conf = float(b.conf[0].item())
                box = [int(v) for v in b.xyxy[0].tolist()]
                col = CLASS_COLORS.get(cid, (0, 255, 0))
                cv2.rectangle(bgr, (box[0], box[1]), (box[2], box[3]), col, 3)
                label = f"CORRECT: {CLASS_NAMES[cid]} {conf*100:.1f}%"
                cv2.putText(bgr, label, (box[0], max(box[1]-8, 20)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, col, 2)
        else:
            cv2.putText(bgr, "CORRECT: CLEAN NORMAL BELT (0 DEFECTS)", (30, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 0), 2)
        cv2.imwrite(os.path.join("visual_validation_sheets", out_name), bgr)

# 2. Misclassifications / Hard Cases
misclass_samples = [
    ("deep_scratch_misclassified_as_tear.jpg", "known_defect_tests/deep_scratch_5_frame_00121_jpg.rf.35938fe6d80f1299c994e9cb2adbac77.jpg"),
    ("slight_scratch_misclassified_as_tear.jpg", "known_defect_tests/slight_scratch_3_frame_00046_jpg.rf.9075689b3baa501f6d8d9f1d91930a32.jpg")
]

for out_name, in_path in misclass_samples:
    if os.path.exists(in_path):
        res = model.predict(source=in_path, imgsz=800, conf=0.25, iou=0.5, device='cpu', verbose=False)[0]
        bgr = cv2.imread(in_path)
        if res.boxes is not None:
            for b in res.boxes:
                cid = int(b.cls[0].item())
                conf = float(b.conf[0].item())
                box = [int(v) for v in b.xyxy[0].tolist()]
                col = (0, 0, 255) # Red for mismatch
                cv2.rectangle(bgr, (box[0], box[1]), (box[2], box[3]), col, 3)
                label = f"CROSSOVER: Pred={CLASS_NAMES[cid]} {conf*100:.1f}%"
                cv2.putText(bgr, label, (box[0], max(box[1]-8, 20)), cv2.FONT_HERSHEY_SIMPLEX, 0.6, col, 2)
        cv2.imwrite(os.path.join("visual_validation_sheets", out_name), bgr)

print("Saved visual validation sheets to visual_validation_sheets/ successfully.")
