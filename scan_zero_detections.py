import os
import glob
from ultralytics import YOLO

MODEL_PATH = "d:/SIH/anband told/models/best_model.pt"
model = YOLO(MODEL_PATH)

CLASS_NAMES = ['Belt Splice', 'Deep Scratch', 'Longitudinal Tear', 'Normal Belt', 'Slight Scratch']

test_imgs = sorted(glob.glob("d:/SIH/anband told/test/images/*.jpg"))
labels_dir = "d:/SIH/anband told/test/labels"

zero_det_records = []

for p in test_imgs:
    fname = os.path.basename(p)
    stem = os.path.splitext(fname)[0]
    lbl_p = os.path.join(labels_dir, stem + ".txt")
    
    gt_classes = []
    if os.path.exists(lbl_p):
        with open(lbl_p) as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    gt_classes.append(int(parts[0]))
                    
    res = model.predict(source=p, imgsz=800, conf=0.25, iou=0.45, verbose=False)[0]
    num_pred = len(res.boxes)
    
    if num_pred == 0:
        zero_det_records.append({
            "file": fname,
            "gt_classes": [CLASS_NAMES[c] for c in gt_classes]
        })

print(f"Total test images: {len(test_imgs)}")
print(f"Images with 0 detections: {len(zero_det_records)}")
for r in zero_det_records:
    print(f"  {r['file']} -> Ground Truth: {r['gt_classes']}")
