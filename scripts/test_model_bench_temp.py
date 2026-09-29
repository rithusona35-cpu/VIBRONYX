import os
import glob
from ultralytics import YOLO

test_models = {
    'models/final_sih_model.pt': 'Active Production (YOLO11s)',
    'models/baseline/original_baseline_model.pt': 'Original Baseline (YOLO11s)',
    'models/candidate/yolo11m_800_medium.pt': 'Candidate Medium (YOLO11m)',
    'models/candidate/yolo11s_800_v3.pt': 'Candidate S 800 v3',
    'runs/detect/experiments/experiment_B_clean_dataset/weights/best.pt': 'Experiment B Clean'
}

test_imgs = [
    ('Longitudinal Tear (golden 00007)', 'golden_test_images/frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg'),
    ('Longitudinal Tear (static sample)', 'static/samples/longitudinal_tear.jpg'),
    ('Splice (golden 00015)', 'golden_test_images/frame_00015_jpg.rf.8130d85e915ded4d5e29721b9dda2ff3.jpg'),
    ('Deep Scratch (golden 00024)', 'golden_test_images/frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg'),
    ('Slight Scratch (golden 00005)', 'golden_test_images/frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg'),
    ('Normal Belt (static sample)', 'static/samples/normal_belt.jpg')
]

for mpath, mdesc in test_models.items():
    if not os.path.exists(mpath):
        print(f'MISSING: {mpath}')
        continue
    yolo = YOLO(mpath)
    print(f'\n=== {mdesc} ({mpath}) ===')
    print('Classes:', yolo.names)
    for label, ipath in test_imgs:
        if not os.path.exists(ipath):
            continue
        res = yolo.predict(source=ipath, imgsz=800, conf=0.15, verbose=False)[0]
        dets = [(yolo.names[int(b.cls[0].item())], round(float(b.conf[0].item()), 4)) for b in res.boxes]
        print(f'  [{label}]: {dets if dets else "No detection (threshold 0.15)"}')
