import os
import glob
import shutil

TEST_DIR = "d:/SIH/anband told/test/images"
OUTPUT_DIRS = [
    "c:/Users/AnbuRithu/Downloads/yolo_output/golden_test_images",
    "c:/Users/AnbuRithu/Downloads/yolo_output/real_world_test",
    "c:/Users/AnbuRithu/Downloads/yolo_output/demo_images",
    "d:/SIH/anband told/golden_test_images",
    "d:/SIH/anband told/real_world_test",
    "d:/SIH/anband told/demo_images"
]

for d in OUTPUT_DIRS:
    os.makedirs(d, exist_ok=True)

test_imgs = sorted(glob.glob(os.path.join(TEST_DIR, "*.jpg")))

# Copy first 12 diverse test images to golden_test_images, real_world_test, and demo_images
for img_p in test_imgs[:12]:
    fname = os.path.basename(img_p)
    for d in OUTPUT_DIRS:
        shutil.copy2(img_p, os.path.join(d, fname))

print(f"Populated golden_test_images, real_world_test, and demo_images with {min(12, len(test_imgs))} images each.")
