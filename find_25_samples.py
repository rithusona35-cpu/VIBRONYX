"""
Collect 5 known ground truth samples for each of the 5 classes:
0: Belt Splice
1: Deep Scratch
2: Longitudinal Tear
3: Normal Belt
4: Slight Scratch
"""
import os
import glob
from collections import defaultdict

SIH_DIR = r"d:\SIH\anband told"
test_labels = glob.glob(os.path.join(SIH_DIR, "test", "labels", "*.txt"))
test_images_dir = os.path.join(SIH_DIR, "test", "images")

class_samples = defaultdict(list)

for lbl_path in sorted(test_labels):
    stem = os.path.splitext(os.path.basename(lbl_path))[0]
    img_path = os.path.join(test_images_dir, stem + ".jpg")
    if not os.path.exists(img_path):
        continue
    with open(lbl_path) as f:
        classes_in_file = set()
        for line in f:
            parts = line.strip().split()
            if len(parts) >= 5:
                classes_in_file.add(int(parts[0]))
        for c in classes_in_file:
            if len(class_samples[c]) < 5:
                class_samples[c].append(stem + ".jpg")

CLASS_NAMES = ['Belt Splice', 'Deep Scratch', 'Longitudinal Tear', 'Normal Belt', 'Slight Scratch']
for c_id in range(5):
    print(f"Class {c_id} ({CLASS_NAMES[c_id]}): {len(class_samples[c_id])} samples")
    for s in class_samples[c_id]:
        print(f"  {s}")
