import os
import json
import torch
import ultralytics
from ultralytics import YOLO

model_paths = {
    "Initial best.pt (Downloads root)": "c:/Users/AnbuRithu/Downloads/yolo_output/best.pt",
    "YOLO11s Run 5 (belt_defect_yolo11s 800px)": "c:/Users/AnbuRithu/Downloads/yolo_output/belt_defect_yolo11s/run_v3_balanced/weights/best.pt",
    "YOLO11m Run 6 (belt_defect_yolo11m 800px)": "c:/Users/AnbuRithu/Downloads/yolo_output/belt_defect_yolo11m/run_800_medium-2/weights/best.pt",
    "YOLO11s Run 3 (run_v3_balanced 512px)": "c:/Users/AnbuRithu/Downloads/yolo_output/run_v3_balanced/weights/best.pt",
    "YOLO11s Run 2 (13 belt_output 512px)": "c:/Users/AnbuRithu/Downloads/yolo_output/13 belt_output/detect/belt_defect_yolo11s/run_512_optimized/weights/best.pt",
    "YOLO11s Run 4 (belt_output 512px)": "c:/Users/AnbuRithu/Downloads/yolo_output/belt_output/detect/belt_defect_yolo11s/run_v3_balanced/weights/best.pt"
}

audit_data = {}

print("PyTorch Version:", torch.__version__)
print("CUDA Available:", torch.cuda.is_available())
print("Ultralytics Version:", ultralytics.__version__)

for label, p in model_paths.items():
    if not os.path.exists(p):
        print(f"Path not found: {p}")
        continue
    
    file_size_mb = round(os.path.getsize(p) / (1024 * 1024), 2)
    
    # Load model with Ultralytics
    model = YOLO(p)
    ckpt = torch.load(p, map_location="cpu", weights_only=False)
    
    train_args = ckpt.get("train_args", {})
    epoch = ckpt.get("epoch", -1)
    
    model_info = {
        "file_path": p,
        "file_size_mb": file_size_mb,
        "task": model.task,
        "classes": model.names,
        "num_classes": len(model.names),
        "epoch_saved": epoch,
        "train_args": {
            "model": train_args.get("model", "unknown"),
            "imgsz": train_args.get("imgsz", -1),
            "epochs": train_args.get("epochs", -1),
            "batch": train_args.get("batch", -1),
            "optimizer": train_args.get("optimizer", "unknown"),
            "lr0": train_args.get("lr0", -1),
            "lrf": train_args.get("lrf", -1),
            "mosaic": train_args.get("mosaic", -1),
            "close_mosaic": train_args.get("close_mosaic", -1),
            "data": train_args.get("data", "unknown")
        }
    }
    
    audit_data[label] = model_info
    print(f"\n[{label}]")
    print(f"  Size: {file_size_mb} MB")
    print(f"  Classes: {model.names}")
    print(f"  Epoch: {epoch}")
    print(f"  Train Args: imgsz={train_args.get('imgsz')}, batch={train_args.get('batch')}, opt={train_args.get('optimizer')}, lr0={train_args.get('lr0')}, mosaic={train_args.get('mosaic')}")

with open("audit_models_dump.json", "w") as f:
    json.dump(audit_data, f, indent=2)
print("\nWrote audit_models_dump.json")
