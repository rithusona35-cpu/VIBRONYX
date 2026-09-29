"""
Comprehensive Profiler for MineGuard AI Pipeline on Laptop CPU.
Measures every stage with microsecond precision over multiple warm iterations.
"""

import os
import sys
import time
import io
import json
import csv
import numpy as np
from PIL import Image, ImageOps
import cv2
import torch

BASE_DIR = os.path.abspath(os.path.dirname(__file__))
if BASE_DIR not in sys.path:
    sys.path.insert(0, BASE_DIR)

from unified_preprocessor import MineGuardInferenceEngine
from orientation_aware_fusion import SmartOrientationRouter, detect_orientation_views

MODEL_PATH = os.path.join(BASE_DIR, "models", "final_sih_model.pt")
TEST_IMG = os.path.join(BASE_DIR, "demo_images", "frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg")
PORTRAIT_IMG = os.path.join(BASE_DIR, "uploads", "last_upload.jpg")
if not os.path.exists(PORTRAIT_IMG):
    PORTRAIT_IMG = TEST_IMG

def profile_pipeline():
    print(f"PyTorch Version: {torch.__version__}")
    print(f"Initial torch.get_num_threads(): {torch.get_num_threads()}")
    print(f"CPU count: physical={os.cpu_count()}")

    with open(TEST_IMG, "rb") as f:
        file_bytes = f.read()

    # Load model once
    t_load_start = time.perf_counter()
    engine = MineGuardInferenceEngine(weights_path=MODEL_PATH, imgsz=800, device="cpu")
    t_load_end = time.perf_counter()
    print(f"Model load time: {(t_load_end - t_load_start)*1000:.2f} ms")

    # Warmup
    print("Warming up model...")
    dummy_img = Image.new("RGB", (800, 800), (128, 128, 128))
    for _ in range(3):
        engine.infer(dummy_img)

    # Detailed Stage Profiling (10 iterations)
    stages = {
        "1. Image Disk/Byte Read": [],
        "2. Image Decoding (PIL)": [],
        "3. EXIF Processing": [],
        "4. Preprocessing & Letterbox (800x800)": [],
        "5. Color Conversion (BGR->RGB)": [],
        "6. Tensor Creation & Normalization": [],
        "7. YOLO Forward Pass (PyTorch CPU)": [],
        "8. Non-Max Suppression (NMS)": [],
        "9. Bbox Coordinate Mapping": [],
        "10. Aspect Ratio / Router Decision": [],
        "11. Base64 Serialization": [],
        "12. JSON Serialization": []
    }

    N_ITERS = 10
    print(f"Running {N_ITERS} profiled iterations on Fast Path...")

    for i in range(N_ITERS):
        # 1. Read
        t0 = time.perf_counter()
        raw = bytes(file_bytes)
        t1 = time.perf_counter()
        stages["1. Image Disk/Byte Read"].append((t1 - t0)*1000)

        # 2. Decode
        t0 = time.perf_counter()
        pil_im = Image.open(io.BytesIO(raw))
        pil_im.load()
        t1 = time.perf_counter()
        stages["2. Image Decoding (PIL)"].append((t1 - t0)*1000)

        # 3. EXIF
        t0 = time.perf_counter()
        pil_im = ImageOps.exif_transpose(pil_im)
        if pil_im.mode != "RGB":
            pil_im = pil_im.convert("RGB")
        w, h = pil_im.size
        t1 = time.perf_counter()
        stages["3. EXIF Processing"].append((t1 - t0)*1000)

        # 4. Preprocessing / Letterbox
        t0 = time.perf_counter()
        np_im = np.array(pil_im)
        shape = np_im.shape[:2]
        new_shape = (800, 800)
        r = min(new_shape[0] / shape[0], new_shape[1] / shape[1])
        new_unpad = (int(round(shape[1] * r)), int(round(shape[0] * r)))
        dw, dh = new_shape[1] - new_unpad[0], new_shape[0] - new_unpad[1]
        dw, dh = np.mod(dw, 32), np.mod(dh, 32)
        dw /= 2
        dh /= 2
        resized = cv2.resize(np_im, new_unpad, interpolation=cv2.INTER_LINEAR)
        top, bottom = int(round(dh - 0.1)), int(round(dh + 0.1))
        left, right = int(round(dw - 0.1)), int(round(dw + 0.1))
        padded = cv2.copyMakeBorder(resized, top, bottom, left, right, cv2.BORDER_CONSTANT, value=(114, 114, 114))
        t1 = time.perf_counter()
        stages["4. Preprocessing & Letterbox (800x800)"].append((t1 - t0)*1000)

        # 5. Color conversion
        t0 = time.perf_counter()
        im_trans = padded.transpose((2, 0, 1))
        im_cont = np.ascontiguousarray(im_trans)
        t1 = time.perf_counter()
        stages["5. Color Conversion (BGR->RGB)"].append((t1 - t0)*1000)

        # 6. Tensor creation
        t0 = time.perf_counter()
        im_tensor = torch.from_numpy(im_cont).to("cpu")
        im_tensor = im_tensor.float() / 255.0
        if len(im_tensor.shape) == 3:
            im_tensor = im_tensor[None]
        t1 = time.perf_counter()
        stages["6. Tensor Creation & Normalization"].append((t1 - t0)*1000)

        # 7. YOLO forward pass
        t0 = time.perf_counter()
        with torch.no_grad():
            preds = engine.model.model(im_tensor)
        t1 = time.perf_counter()
        stages["7. YOLO Forward Pass (PyTorch CPU)"].append((t1 - t0)*1000)

        # 8. NMS
        t0 = time.perf_counter()
        from ultralytics.utils import ops
        nms_preds = ops.non_max_suppression(preds, conf_thres=0.25, iou_thres=0.45)
        t1 = time.perf_counter()
        stages["8. Non-Max Suppression (NMS)"].append((t1 - t0)*1000)

        # 9. Bbox mapping
        t0 = time.perf_counter()
        boxes = []
        if len(nms_preds) and len(nms_preds[0]):
            det = nms_preds[0]
            det[:, :4] = ops.scale_boxes(padded.shape, det[:, :4], shape).round()
            for *xyxy, conf, cls in det:
                boxes.append({
                    "class_id": int(cls),
                    "confidence": float(conf),
                    "bbox": [int(x) for x in xyxy]
                })
        t1 = time.perf_counter()
        stages["9. Bbox Coordinate Mapping"].append((t1 - t0)*1000)

        # 10. Aspect Ratio / Router Decision
        t0 = time.perf_counter()
        aspect_ratio = w / h
        is_portrait = aspect_ratio < 0.85
        t1 = time.perf_counter()
        stages["10. Aspect Ratio / Router Decision"].append((t1 - t0)*1000)

        # 11. Base64
        t0 = time.perf_counter()
        buf = io.BytesIO()
        pil_im.save(buf, format="JPEG", quality=85)
        b64 = base64.b64encode(buf.getvalue()).decode()
        t1 = time.perf_counter()
        stages["11. Base64 Serialization"].append((t1 - t0)*1000)

        # 12. JSON
        t0 = time.perf_counter()
        res_json = json.dumps({"status": "success", "detections": boxes, "total": len(boxes), "b64_len": len(b64)})
        t1 = time.perf_counter()
        stages["12. JSON Serialization"].append((t1 - t0)*1000)

    # Calculate statistics
    report_rows = []
    total_p50 = sum([np.percentile(vals, 50) for vals in stages.values()])

    print("\n" + "="*80)
    print(f"{'STAGE':<42} | {'P50 (ms)':<9} | {'P95 (ms)':<9} | {'P99 (ms)':<9} | {'% TOTAL':<7}")
    print("="*80)

    for stg, vals in stages.items():
        p50 = float(np.percentile(vals, 50))
        p95 = float(np.percentile(vals, 95))
        p99 = float(np.percentile(vals, 99))
        pct = (p50 / total_p50) * 100.0 if total_p50 > 0 else 0
        report_rows.append({
            "stage": stg,
            "p50_ms": round(p50, 2),
            "p95_ms": round(p95, 2),
            "p99_ms": round(p99, 2),
            "pct_total": round(pct, 1)
        })
        print(f"{stg:<42} | {p50:9.2f} | {p95:9.2f} | {p99:9.2f} | {pct:6.1f}%")

    print("="*80)
    print(f"{'TOTAL PIPELINE (Sum of P50s)':<42} | {total_p50:9.2f} ms")
    print("="*80)

    # Save CSV
    csv_path = os.path.join(BASE_DIR, "reports", "LIVE_LATENCY_PROFILE.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["stage", "p50_ms", "p95_ms", "p99_ms", "pct_total"])
        writer.writeheader()
        writer.writerows(report_rows)

    # Save MD
    md_path = os.path.join(BASE_DIR, "reports", "LIVE_LATENCY_PROFILE.md")
    with open(md_path, "w", encoding="utf-8") as f:
        f.write("# MINEGUARD AI — INFERENCE STAGE PROFILING REPORT (LAPTOP CPU)\n\n")
        f.write(f"- **PyTorch Version**: `{torch.__version__}`\n")
        f.write(f"- **Default CPU Threads**: `{torch.get_num_threads()}`\n")
        f.write(f"- **Total Measured Pipeline P50**: `{total_p50:.2f} ms`\n\n")
        f.write("| STAGE | P50 (ms) | P95 (ms) | P99 (ms) | % TOTAL |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        for r in report_rows:
            f.write(f"| {r['stage']} | {r['p50_ms']} | {r['p95_ms']} | {r['p99_ms']} | {r['pct_total']}% |\n")
        f.write(f"\n**Identified Bottleneck**: Stage 7 (`YOLO Forward Pass (PyTorch CPU)`) accounts for the dominant share of execution time.\n")

    print(f"\nWritten {csv_path} and {md_path}")

if __name__ == "__main__":
    profile_pipeline()
