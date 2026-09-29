import os
import glob
from PIL import Image
from ultralytics import YOLO

model_path = r'D:\SIH\anband told\models\best_model.pt'
model = YOLO(model_path)

test_images = glob.glob('error_cases/*') + glob.glob('golden_test_images/*')[:5]

print("=== CONFIDENCE SWEEP AUDIT (PHASE 8) ===")
for img_path in test_images:
    filename = os.path.basename(img_path)
    print(f"\nImage: {filename}")
    for conf in [0.10, 0.15, 0.20, 0.25, 0.30, 0.35, 0.40, 0.45, 0.50]:
        res = model.predict(img_path, conf=conf, imgsz=800, verbose=False)[0]
        dets = []
        for box in res.boxes:
            c = int(box.cls[0].item())
            cf = round(float(box.conf[0].item()), 3)
            dets.append(f"{res.names[c]} ({cf})")
        print(f"  conf={conf:.2f}: {len(dets)} detections -> {dets}")
