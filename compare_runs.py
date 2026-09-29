import pandas as pd
import yaml
import os

runs = [
    ("Run 1: Baseline YOLO11s (640px)", "detect/train"),
    ("Run 2: High-Augment YOLO11s (512px, b=67)", "13 belt_output/detect/belt_defect_yolo11s/run_512_optimized"),
    ("Run 3: Balanced YOLO11s (512px, b=16)", "run_v3_balanced"),
    ("Run 4: Belt Output YOLO11s (512px, b=16)", "belt_output/detect/belt_defect_yolo11s/run_v3_balanced"),
    ("Run 5: Belt Defect YOLO11s (800px, b=16)", "belt_defect_yolo11s/run_v3_balanced"),
    ("Run 6: YOLO11m Medium (800px, b=8, cls=1.2)", "belt_defect_yolo11m/run_800_medium-2")
]

print("=== PROGRESSION ACROSS ALL RUNS (INCLUDING NEW YOLO11m) ===")
for title, folder in runs:
    if not os.path.exists(folder + "/results.csv"):
        print(f"[{title}] - Not found\n")
        continue
    with open(folder + "/args.yaml") as f:
        args = yaml.safe_load(f)
    df = pd.read_csv(folder + "/results.csv")
    df.columns = df.columns.str.strip()
    
    b50 = df["metrics/mAP50(B)"].max()
    b50_ep = df["metrics/mAP50(B)"].idxmax() + 1
    b95 = df["metrics/mAP50-95(B)"].max()
    b95_ep = df["metrics/mAP50-95(B)"].idxmax() + 1
    bp = df["metrics/precision(B)"].max()
    bp_ep = df["metrics/precision(B)"].idxmax() + 1
    br = df["metrics/recall(B)"].max()
    br_ep = df["metrics/recall(B)"].idxmax() + 1
    
    print(f"[{title}]")
    print(f"  Model: {args.get('model')} | imgsz: {args.get('imgsz')} | batch: {args.get('batch')} | cls_weight: {args.get('cls')}")
    print(f"  Total Epochs Trained: {len(df)}")
    print(f"  Best mAP@50:    {b50*100:.2f}% (Epoch {b50_ep})")
    print(f"  Best mAP@50-95: {b95*100:.2f}% (Epoch {b95_ep})")
    print(f"  Peak Precision: {bp*100:.2f}% (Epoch {bp_ep})")
    print(f"  Peak Recall:    {br*100:.2f}% (Epoch {br_ep})")
    print(f"  Best Val Box Loss: {df['val/box_loss'].min():.4f}")
    print(f"  Best Val Cls Loss: {df['val/cls_loss'].min():.4f}")
    print(f"  Best Val DFL Loss: {df['val/dfl_loss'].min():.4f}")
    
    # Check metrics at best mAP50 epoch
    best_row = df.iloc[b50_ep - 1]
    print(f"  At Best mAP50 Epoch ({b50_ep}): Prec={best_row['metrics/precision(B)']*100:.2f}%, Rec={best_row['metrics/recall(B)']*100:.2f}%")
    print()
