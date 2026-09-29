import cv2
import numpy as np
from PIL import Image
from ultralytics import YOLO

def test_crops():
    img_path = 'uploads/last_upload.jpg'
    img = cv2.imread(img_path) # BGR
    h, w = img.shape[:2]
    model = YOLO('models/final_sih_model.pt')
    
    print(f"Full image: {w}x{h}")
    
    # Crop center 1200x1200
    cy, cx = h // 2, w // 2
    crop1 = img[cy-600:cy+600, cx-600:cx+600]
    res_crop1 = model.predict(source=crop1, imgsz=800, conf=0.01, verbose=False)
    print(f"Center crop (1200x1200): {len(res_crop1[0].boxes)} boxes at conf=0.01")
    for b in res_crop1[0].boxes:
        cls_id = int(b.cls[0].item())
        print(f"  Class {cls_id} ({model.names[cls_id]}): conf {float(b.conf[0].item()):.4f}, box {b.xyxy[0].tolist()}")

    # Crop vertical center 800x800
    crop800 = img[cy-400:cy+400, cx-400:cx+400]
    res_crop800 = model.predict(source=crop800, imgsz=800, conf=0.01, verbose=False)
    print(f"\nCenter crop (800x800): {len(res_crop800[0].boxes)} boxes at conf=0.01")
    for b in res_crop800[0].boxes:
        cls_id = int(b.cls[0].item())
        print(f"  Class {cls_id} ({model.names[cls_id]}): conf {float(b.conf[0].item()):.4f}, box {b.xyxy[0].tolist()}")

    # Rotate crop800 90 deg
    crop800_rot = cv2.rotate(crop800, cv2.ROTATE_90_CLOCKWISE)
    res_crop800_rot = model.predict(source=crop800_rot, imgsz=800, conf=0.01, verbose=False)
    print(f"\nCenter crop (800x800 ROTATED 90 deg): {len(res_crop800_rot[0].boxes)} boxes at conf=0.01")
    for b in res_crop800_rot[0].boxes:
        cls_id = int(b.cls[0].item())
        print(f"  Class {cls_id} ({model.names[cls_id]}): conf {float(b.conf[0].item()):.4f}, box {b.xyxy[0].tolist()}")

    # Rotate full image 90 deg and test with imgsz=800, 1024, 1280
    img_rot = cv2.rotate(img, cv2.ROTATE_90_CLOCKWISE)
    for s in [640, 800, 1024, 1280]:
        res_rot = model.predict(source=img_rot, imgsz=s, conf=0.05, verbose=False)
        print(f"\nFull Rotated 90 deg at imgsz={s}: {len(res_rot[0].boxes)} boxes at conf=0.05")
        for b in res_rot[0].boxes:
            cls_id = int(b.cls[0].item())
            print(f"  Class {cls_id} ({model.names[cls_id]}): conf {float(b.conf[0].item()):.4f}, box {b.xyxy[0].tolist()}")

if __name__ == '__main__':
    test_crops()
