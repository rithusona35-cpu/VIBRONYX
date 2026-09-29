import os
from PIL import Image
from unified_preprocessor import MineGuardInferenceEngine

def check():
    engine = MineGuardInferenceEngine('models/final_sih_model.pt', imgsz=800, conf_threshold=0.25, iou_threshold=0.50, device='cpu')
    img_path = 'uploads/last_upload.jpg'
    if not os.path.exists(img_path):
        print("No uploads/last_upload.jpg")
        return
    img = Image.open(img_path)
    print("Image size:", img.size, "format:", img.format, "mode:", img.mode)
    res = engine.infer(img, conf=0.25)
    print("At conf 0.25: Health State =", res.get("health_state"))
    print("Detections count =", len(res.get("detections", [])))
    for d in res.get("detections", []):
        print("  ->", d.get("class_name"), "conf:", d.get("confidence"), "bbox:", d.get("bbox"))
    
    print("\nSweeping confidence thresholds from 0.01 to 0.50:")
    for conf in [0.01, 0.05, 0.10, 0.15, 0.20, 0.25, 0.30, 0.40, 0.50]:
        r = engine.infer(img, conf=conf)
        dets = r.get("detections", [])
        summary = [(d["class_name"], round(d["confidence"], 3)) for d in dets]
        print(f"Conf {conf:.2f}: {len(dets)} detections -> {summary}")

if __name__ == '__main__':
    check()
