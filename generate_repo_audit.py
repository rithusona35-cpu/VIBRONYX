import os
import glob
import csv

lines = []
lines.append("# MineGuard AI — Final Phase Repository Audit")
lines.append("**SIH 26008: Automated Real-Time Conveyor Belt Defect Detection**\n")
lines.append("Date: 2026-09-18\n")

lines.append("## 1. Model Artifacts (.pt & .onnx)")
lines.append("A total of 43 model checkpoints were identified across project directories (excluding venv/):\n")
lines.append("| Model Path | Architecture | Size (MB) | Role |")
lines.append("| :--- | :--- | :--- | :--- |")

csv_path = "reports/final_phase_model_inventory.csv"
if os.path.exists(csv_path):
    with open(csv_path, "r", encoding="utf-8") as fp:
        reader = csv.DictReader(fp)
        for row in reader:
            m_path = row["model_path"]
            arch = row["architecture"]
            sz = row["size_mb"]
            role = row["role"]
            lines.append(f"| `{m_path}` | {arch} | {sz} | **{role}** |")

lines.append("\n### Key Production & Baseline Reference Models:")
lines.append("- **Current Production Model**: `models/final_sih_model.pt` (18.32 MB, MD5: `ee136ef26e5e8e88863f698d28ae83fa`)")
lines.append("- **Production ONNX Export**: `models/final_sih_model.onnx` (36.27 MB, opset 18, onnxslim optimized)")
lines.append("- **Original Baseline Model**: `detect/train/weights/best.pt` (18.29 MB, MD5: `1ec35c64c7ad0606992589083505c87e`)")
lines.append("- **Archived V1 Production**: `models/archive/final_sih_model_v1.pt`")
lines.append("- **Archived V2 Candidate**: `models/final_sih_model_v2.pt` (Experiment C candidate)")
lines.append("- **Experiment B Checkpoint**: `experiments/experiment_B_clean_dataset/best.pt`")
lines.append("- **Experiment C Checkpoint**: `experiments/experiment_C_hard_cases/best.pt`")

lines.append("\n## 2. Dataset Inventory & Configuration Files")
lines.append("| Dataset Path | Format / YAML | Train Images | Val Images | Test Images | Notes |")
lines.append("| :--- | :--- | :--- | :--- | :--- | :--- |")

datasets = [
    ("datasets/dataset_v2_5class", "datasets/dataset_v2_5class/data.yaml", 1175, 191, 190, "Cleaned 5-class sequence-isolated dataset"),
    ("datasets/dataset_v2_4defect", "datasets/dataset_v2_4defect/data.yaml", 1175, 191, 190, "Cleaned 4-defect dataset (healthy belt as negative backgrounds)"),
    ("datasets/hard_cases", "N/A", 0, 0, 0, "Curated hard cases for low-confidence scratches & tears")
]

for d_path, yaml_p, tr, v, te, notes in datasets:
    lines.append(f"| `{d_path}` | `{yaml_p}` | {tr} | {v} | {te} | {notes} |")

lines.append("\n## 3. Test & Holdout Suites")
lines.append("- **`real_world_test/` (12 unique evaluation frames)**:")
lines.append("  - `REAL_HEALTHY/`: 1 frame (`frame_00021_jpg...`)")
lines.append("  - `REAL_BELT_SPLICE/`: 7 frames (`frame_00002`, `frame_00003`, `frame_00005`, `frame_00012`, `frame_00015`, `frame_00019`, `frame_00035`)")
lines.append("  - `REAL_LONGITUDINAL_TEAR/`: 3 frames (`frame_00007`, `frame_00043`, `frame_00045`)")
lines.append("  - `REAL_DEEP_SCRATCH/`: 1 frame (`frame_00024`)")
lines.append("  - `REAL_SLIGHT_SCRATCH/`: 1 frame (`frame_00005`)")
lines.append("- **`known_defect_tests/`**: 25 verified industrial images spanning all 5 classes (5 per class).")
lines.append("- **`hard_negatives/`**: 6 high-difficulty clean belt textures, lighting gradients, and seams.")
lines.append("- **`error_cases/`**: 9 curated false positive, false negative, and poor bounding box reference images.")

lines.append("\n## 4. Reports & Verification History")
reports = glob.glob("reports/*.*")
lines.append("Discovered reports in `reports/`:")
for r in sorted(reports):
    r_rel = r.replace("\\", "/")
    abs_p = os.path.abspath(r).replace('\\', '/')
    lines.append(f"- [`{r_rel}`](file:///{abs_p})")

out_path = "reports/final_phase_repository_audit.md"
with open(out_path, "w", encoding="utf-8") as fp:
    fp.write("\n".join(lines))

print(f"Wrote {out_path} successfully")
