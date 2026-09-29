import os
import glob
from collections import defaultdict
import cv2
import numpy as np

DATASET_ROOT = "d:/SIH/anband told"
SPLITS = ["train", "valid", "test"]

def dhash(image, hash_size=8):
    # Resize to (hash_size + 1, hash_size)
    resized = cv2.resize(image, (hash_size + 1, hash_size))
    # Compute horizontal gradient
    diff = resized[:, 1:] > resized[:, :-1]
    # Convert binary array to integer hash
    return sum([2 ** i for (i, v) in enumerate(diff.flatten()) if v])

def hamming_distance(h1, h2):
    return bin(h1 ^ h2).count('1')

print("Computing perceptual dHash across all splits...")

image_data = []

for split in SPLITS:
    img_files = glob.glob(os.path.join(DATASET_ROOT, split, "images", "*.*"))
    for p in img_files:
        fname = os.path.basename(p)
        # Extract base sequence prefix (e.g. 'frame_00002')
        prefix = fname.split(".")[0].split("_aug_")[0]
        
        # Read small thumbnail for dHash
        img = cv2.imread(p, cv2.IMREAD_GRAYSCALE)
        if img is not None:
            h = dhash(img)
            image_data.append({
                "split": split,
                "filename": fname,
                "prefix": prefix,
                "path": p,
                "dhash": h
            })

print(f"Computed hashes for {len(image_data)} images.")

# 1. Prefix-based sequence check across splits
prefix_by_split = defaultdict(lambda: defaultdict(list))
for item in image_data:
    prefix_by_split[item["prefix"]][item["split"]].append(item["filename"])

prefix_leakage = []
for prefix, splits_dict in prefix_by_split.items():
    if len(splits_dict) > 1:
        prefix_leakage.append((prefix, {s: len(f) for s, f in splits_dict.items()}))

print(f"\nSequence / Prefix Leakage across splits: {len(prefix_leakage)} instances")
for p, s_dict in prefix_leakage[:15]:
    print(f"  Prefix '{p}' appears across: {s_dict}")

# 2. Near-duplicate perceptual hash check (Hamming distance <= 2)
# Sample cross-split pairs
cross_split_near_duplicates = 0
train_items = [x for x in image_data if x["split"] == "train"]
eval_items = [x for x in image_data if x["split"] in ("valid", "test")]

near_duplicates_found = []
for ev in eval_items:
    for tr in train_items:
        dist = hamming_distance(ev["dhash"], tr["dhash"])
        if dist <= 1: # Extremely similar or identical perceptual appearance
            near_duplicates_found.append((ev["split"], ev["filename"], tr["split"], tr["filename"], dist))
            if len(near_duplicates_found) >= 20:
                break
    if len(near_duplicates_found) >= 20:
        break

print(f"\nPerceptually Near-Duplicate Cross-Split Pairs Sampled: {len(near_duplicates_found)}")
for e_split, e_file, t_split, t_file, dist in near_duplicates_found[:10]:
    print(f"  {e_split}/{e_file} <=> {t_split}/{t_file} (Hamming Distance: {dist})")
