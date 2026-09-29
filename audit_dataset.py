import os
import glob
import hashlib
from collections import defaultdict, Counter
import cv2
import pandas as pd
import numpy as np

DATASET_ROOT = "d:/SIH/anband told"
SPLITS = ["train", "valid", "test"]
CLASS_NAMES = ["belt_splice", "deep_scratch", "longitudinal_tear", "normal_belt", "slight_scratch"]

audit_rows = []
split_stats = defaultdict(lambda: {
    "total_images": 0,
    "corrupted_images": 0,
    "empty_label_images": 0,
    "missing_label_images": 0,
    "total_boxes": 0,
    "class_box_counts": Counter(),
    "class_img_counts": Counter(),
    "problematic_boxes": 0
})

image_hashes = {}
leakage_cases = []

print("Starting full dataset audit across train, valid, test...")

for split in SPLITS:
    img_dir = os.path.join(DATASET_ROOT, split, "images")
    lbl_dir = os.path.join(DATASET_ROOT, split, "labels")
    
    if not os.path.exists(img_dir):
        print(f"Directory {img_dir} does not exist!")
        continue

    # Find all images
    img_files = glob.glob(os.path.join(img_dir, "*.*"))
    img_files = [f for f in img_files if f.lower().endswith(('.jpg', '.jpeg', '.png', '.webp'))]
    split_stats[split]["total_images"] = len(img_files)

    for img_path in img_files:
        filename = os.path.basename(img_path)
        stem = os.path.splitext(filename)[0]
        lbl_path = os.path.join(lbl_dir, stem + ".txt")

        # Check image integrity
        try:
            img = cv2.imread(img_path)
            if img is None:
                raise ValueError("cv2.imread returned None")
            img_h, img_w = img.shape[:2]
        except Exception as e:
            split_stats[split]["corrupted_images"] += 1
            audit_rows.append({
                "image": filename,
                "split": split,
                "class": "CORRUPTED",
                "bbox_count": 0,
                "image_width": 0,
                "image_height": 0,
                "annotation_quality": "INVALID",
                "possible_problem": f"Corrupted image file: {e}"
            })
            continue

        # Compute hash for duplicate / leakage detection
        with open(img_path, "rb") as f:
            h = hashlib.md5(f.read()).hexdigest()
        
        if h in image_hashes:
            orig_split, orig_name = image_hashes[h]
            if orig_split != split:
                leakage_cases.append((orig_split, orig_name, split, filename))
        else:
            image_hashes[h] = (split, filename)

        # Check label file
        if not os.path.exists(lbl_path):
            split_stats[split]["missing_label_images"] += 1
            audit_rows.append({
                "image": filename,
                "split": split,
                "class": "UNANNOTATED",
                "bbox_count": 0,
                "image_width": img_w,
                "image_height": img_h,
                "annotation_quality": "CLEAN_BACKGROUND_OR_MISSING",
                "possible_problem": "No label file found (Background image)"
            })
            continue

        # Parse labels
        with open(lbl_path, "r") as f:
            lines = [l.strip() for l in f.readlines() if l.strip()]

        if len(lines) == 0:
            split_stats[split]["empty_label_images"] += 1
            audit_rows.append({
                "image": filename,
                "split": split,
                "class": "EMPTY_LABEL",
                "bbox_count": 0,
                "image_width": img_w,
                "image_height": img_h,
                "annotation_quality": "BACKGROUND",
                "possible_problem": "Empty label file (True Background image)"
            })
            continue

        # Check annotations inside file
        img_classes = set()
        img_boxes = []
        has_issue = False
        issues = []

        for line_idx, line in enumerate(lines):
            parts = line.split()
            if len(parts) < 5:
                has_issue = True
                issues.append(f"Line {line_idx+1}: malformed line with {len(parts)} values")
                continue
            
            try:
                cls_id = int(parts[0])
                xc, yc, w, h = map(float, parts[1:5])
            except ValueError:
                has_issue = True
                issues.append(f"Line {line_idx+1}: invalid non-float values")
                continue

            # Class ID validity
            if cls_id < 0 or cls_id >= len(CLASS_NAMES):
                has_issue = True
                issues.append(f"Line {line_idx+1}: unknown class_id {cls_id}")
                cls_name = f"unknown_{cls_id}"
            else:
                cls_name = CLASS_NAMES[cls_id]

            split_stats[split]["class_box_counts"][cls_name] += 1
            split_stats[split]["total_boxes"] += 1
            img_classes.add(cls_name)

            # Coordinates validity check
            if xc < 0 or xc > 1 or yc < 0 or yc > 1 or w <= 0 or w > 1 or h <= 0 or h > 1:
                has_issue = True
                issues.append(f"Line {line_idx+1} ({cls_name}): box coords outside [0, 1] [xc={xc}, yc={yc}, w={w}, h={h}]")

            # Check boundary overflow
            xmin = xc - w/2
            xmax = xc + w/2
            ymin = yc - h/2
            ymax = yc + h/2
            if xmin < -0.05 or xmax > 1.05 or ymin < -0.05 or ymax > 1.05:
                has_issue = True
                issues.append(f"Line {line_idx+1} ({cls_name}): box overflows image bounds [xmin={xmin:.3f}, xmax={xmax:.3f}, ymin={ymin:.3f}, ymax={ymax:.3f}]")

            # Extreme sizes
            box_area = w * h
            if box_area < 0.0002:
                issues.append(f"Line {line_idx+1} ({cls_name}): extremely small bounding box (area={box_area*100:.3f}% of image)")
            elif box_area > 0.95:
                issues.append(f"Line {line_idx+1} ({cls_name}): giant box covers >95% of image (area={box_area*100:.1f}%)")

            img_boxes.append((cls_id, xc, yc, w, h))

        # Check duplicate annotations in same image
        for i in range(len(img_boxes)):
            for j in range(i+1, len(img_boxes)):
                b1 = img_boxes[i]
                b2 = img_boxes[j]
                if b1[0] == b2[0]: # same class
                    # Check overlap distance
                    if abs(b1[1]-b2[1]) < 0.01 and abs(b1[2]-b2[2]) < 0.01 and abs(b1[3]-b2[3]) < 0.01 and abs(b1[4]-b2[4]) < 0.01:
                        issues.append(f"Duplicate overlapping annotation found for class {CLASS_NAMES[b1[0]]}")

        for cls_name in img_classes:
            split_stats[split]["class_img_counts"][cls_name] += 1

        quality = "SUSPICIOUS" if has_issue or issues else "GOOD"
        problem_str = "; ".join(issues) if issues else "None"
        if quality != "GOOD":
            split_stats[split]["problematic_boxes"] += 1

        audit_rows.append({
            "image": filename,
            "split": split,
            "class": ", ".join(img_classes) if img_classes else "NONE",
            "bbox_count": len(lines),
            "image_width": img_w,
            "image_height": img_h,
            "annotation_quality": quality,
            "possible_problem": problem_str
        })

df_audit = pd.DataFrame(audit_rows)
df_audit.to_csv("dataset_audit.csv", index=False)
print(f"Generated dataset_audit.csv with {len(df_audit)} rows.")

# Generate split report
split_report_rows = []
for split in SPLITS:
    s = split_stats[split]
    row = {
        "split": split,
        "total_images": s["total_images"],
        "corrupted_images": s["corrupted_images"],
        "empty_label_images": s["empty_label_images"],
        "missing_label_images": s["missing_label_images"],
        "total_annotations": s["total_boxes"],
        "problematic_images": s["problematic_boxes"]
    }
    for c in CLASS_NAMES:
        row[f"boxes_{c}"] = s["class_box_counts"][c]
        row[f"imgs_{c}"] = s["class_img_counts"][c]
    split_report_rows.append(row)

df_split = pd.DataFrame(split_report_rows)
df_split.to_csv("dataset_split_report.csv", index=False)
print("Generated dataset_split_report.csv")

print("\n=== DATASET AUDIT SUMMARY ===")
print(df_split.to_string())

print(f"\nData Leakage Count across splits (Exact Image Duplicates): {len(leakage_cases)}")
for orig_split, orig_name, split, filename in leakage_cases[:10]:
    print(f"  Leakage: {orig_split}/{orig_name} == {split}/{filename}")
