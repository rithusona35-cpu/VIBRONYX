import os
from PIL import Image, ExifTags
import numpy as np
from ultralytics import YOLO

def analyze():
    img_path = 'uploads/last_upload.jpg'
    img = Image.open(img_path)
    print("=== IMAGE PROPERTIES ===")
    print("Dimensions (W x H):", img.size)
    print("Aspect Ratio:", img.size[0] / img.size[1])
    print("Mode:", img.mode)
    
    # Check EXIF
    exif = img.getexif()
    exif_data = {}
    if exif:
        for tag_id, val in exif.items():
            tag_name = ExifTags.TAGS.get(tag_id, str(tag_id))
            exif_data[tag_name] = str(val)[:50]
    print("EXIF orientation:", exif_data.get("Orientation", "None"))
    print("Other EXIF keys:", list(exif_data.keys())[:10])

    # Raw YOLO model prediction directly without wrapper
    model = YOLO('models/final_sih_model.pt')
    
    print("\n=== RAW YOLO PREDICT (original image, imgsz=800) ===")
    res800 = model.predict(source=img, imgsz=800, conf=0.001, verbose=True)
    print("imgsz=800 raw boxes count at conf=0.001:", len(res800[0].boxes))
    for b in res800[0].boxes:
        print(f"  Class: {int(b.cls[0].item())} ({model.names[int(b.cls[0].item())]}), Conf: {float(b.conf[0].item()):.4f}, Box: {b.xyxy[0].tolist()}")

    print("\n=== RAW YOLO PREDICT (imgsz=1024) ===")
    res1024 = model.predict(source=img, imgsz=1024, conf=0.001, verbose=False)
    print("imgsz=1024 raw boxes count at conf=0.001:", len(res1024[0].boxes))
    for b in res1024[0].boxes:
        print(f"  Class: {int(b.cls[0].item())} ({model.names[int(b.cls[0].item())]}), Conf: {float(b.conf[0].item()):.4f}, Box: {b.xyxy[0].tolist()}")

    print("\n=== RAW YOLO PREDICT (imgsz=1280) ===")
    res1280 = model.predict(source=img, imgsz=1280, conf=0.001, verbose=False)
    print("imgsz=1280 raw boxes count at conf=0.001:", len(res1280[0].boxes))
    for b in res1280[0].boxes:
        print(f"  Class: {int(b.cls[0].item())} ({model.names[int(b.cls[0].item())]}), Conf: {float(b.conf[0].item()):.4f}, Box: {b.xyxy[0].tolist()}")

    # Try orientation transpose if EXIF orientation exists
    from PIL import ImageOps
    img_transposed = ImageOps.exif_transpose(img)
    if img_transposed.size != img.size:
        print("\n=== EXIF TRANSPOSED IMAGE ===")
        print("Transposed size:", img_transposed.size)
        res_trans = model.predict(source=img_transposed, imgsz=800, conf=0.001, verbose=False)
        print("Transposed raw boxes count at conf=0.001:", len(res_trans[0].boxes))

    # Also rotate 90 degrees just in case it was a portrait photo of a horizontal belt
    img_rot90 = img.rotate(90, expand=True)
    res_rot90 = model.predict(source=img_rot90, imgsz=800, conf=0.001, verbose=False)
    print("\nRotated 90 deg count at conf=0.001:", len(res_rot90[0].boxes))
    for b in res_rot90[0].boxes:
        print(f"  Class: {int(b.cls[0].item())} ({model.names[int(b.cls[0].item())]}), Conf: {float(b.conf[0].item()):.4f}, Box: {b.xyxy[0].tolist()}")

    img_rot270 = img.rotate(270, expand=True)
    res_rot270 = model.predict(source=img_rot270, imgsz=800, conf=0.001, verbose=False)
    print("\nRotated 270 deg count at conf=0.001:", len(res_rot270[0].boxes))
    for b in res_rot270[0].boxes:
        print(f"  Class: {int(b.cls[0].item())} ({model.names[int(b.cls[0].item())]}), Conf: {float(b.conf[0].item()):.4f}, Box: {b.xyxy[0].tolist()}")

if __name__ == '__main__':
    analyze()
