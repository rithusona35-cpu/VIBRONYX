import os
import glob
import shutil

TEST_DIR = "d:/SIH/anband told/test"
GOLDEN_DIR = "c:/Users/AnbuRithu/Downloads/yolo_output/golden_test_images"
os.makedirs(GOLDEN_DIR, exist_ok=True)

CLASS_NAMES = ['belt_splice', 'deep_scratch', 'longitudinal_tear', 'normal_belt', 'slight_scratch']

# Find representative test images covering the classes
img_files = glob.glob(os.path.join(TEST_DIR, "images", "*.jpg"))
selected = {}

for img_p in img_files:
    stem = os.path.splitext(os.path.basename(img_p))[0]
    lbl_p = os.path.join(TEST_DIR, "labels", stem + ".txt")
    if os.path.exists(lbl_p):
        with open(lbl_p) as f:
            classes_in_img = [int(line.split()[0]) for line in f if line.strip()]
        for c in classes_in_img:
            c_name = CLASS_NAMES[c]
            if c_name not in selected:
                selected[c_name] = (img_p, lbl_p)

print("Selected Golden Test Images:")
for c_name, (img_p, lbl_p) in selected.items():
    dest_img = os.path.join(GOLDEN_DIR, os.path.basename(img_p))
    shutil.copy2(img_p, dest_img)
    print(f"  Class [{c_name}]: {os.path.basename(img_p)}")

print(f"\nCopied {len(selected)} golden test images to {GOLDEN_DIR}")
