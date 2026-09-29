# MODEL_AUDIT.md
## Technical Verification Report of Trained YOLO Models

### 1. Runtime Environment
* **Python**: 3.10.8 (AMD64)
* **PyTorch**: 2.14.0+cpu
* **Ultralytics**: 8.4.138
* **CUDA Hardware Available**: False (Host machine is running on Intel/AMD multi-core CPU)
* **Training Platform**: Kaggle GPU (Tesla T4 / P100) with mixed precision (`amp=True`)

---

### 2. Discovered Model Artifacts

| Model Identifier | Architecture | File Size | Input Resolution | Batch | Optimizer | Mosaic | Saved Checkpoint |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Initial `best.pt`** | YOLO11s (Small) | 18.29 MB | 640 × 640 | 16 | AdamW (lr0=0.001) | 0.0 (Off) | `c:/Users/AnbuRithu/Downloads/yolo_output/best.pt` |
| **Run 2 (`13 belt_output`)** | YOLO11s (Small) | 18.28 MB | 512 × 512 | 67 | SGD (lr0=0.01) | 1.0 (Heavy) | `.../13 belt_output/.../best.pt` |
| **Run 3 (`run_v3_balanced`)** | YOLO11s (Small) | 18.27 MB | 512 × 512 | 16 | AdamW (lr0=0.001) | 0.5 | `.../run_v3_balanced/weights/best.pt` |
| **Run 4 (`belt_output`)** | YOLO11s (Small) | 18.28 MB | 512 × 512 | 16 | AdamW (lr0=0.001) | 0.5 | `.../belt_output/.../best.pt` |
| **Run 5 (`belt_defect_yolo11s`)** | **YOLO11s (Small)** | **18.32 MB** | **800 × 800** | **16** | **AdamW (lr0=0.001)** | **0.5** | `.../belt_defect_yolo11s/.../best.pt` |
| **Run 6 (`belt_defect_yolo11m`)** | **YOLO11m (Medium)** | **38.68 MB** | **800 × 800** | **8** | **AdamW (lr0=0.001)** | **0.5** | `.../belt_defect_yolo11m/.../best.pt` |

---

### 3. Model Architecture Specifications

#### YOLO11s (`yolo11s.pt` based):
* **Layers**: 182 layers
* **Parameters**: 9,429,727 parameters
* **FLOPs**: 21.7 GFLOPs (at 640x640)
* **Average CPU Latency (800x800)**: **~113 ms** (~8.8 FPS)
* **Memory Footprint**: ~18.3 MB

#### YOLO11m (`yolo11m.pt` based):
* **Layers**: 231 layers
* **Parameters**: 20,056,863 parameters
* **FLOPs**: 68.3 GFLOPs (at 640x640)
* **Average CPU Latency (800x800)**: **~424 ms** (~2.4 FPS)
* **Memory Footprint**: ~38.7 MB

---

### 4. Absolute Class Mapping (5 Classes)
Every audited `.pt` weight file strictly encodes the identical 5 classes:
```python
{
    0: 'belt splice',
    1: 'deep scratch',
    2: 'longitudinal tear',
    3: 'normal belt',
    4: 'slight scratch'
}
```

---

### 5. Benchmark Performance Summary

| Model | mAP@50 | mAP@50-95 | Peak Precision | Peak Recall | CPU FPS (800px) | Deployment Recommendation |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **YOLO11s (Run 5, 800px)** | **59.75%** | **28.92%** | 70.08% | 65.86% | **8.8 FPS** | **RECOMMENDED FOR CPU & LOCAL PROTOTYPE** |
| **YOLO11m (Run 6, 800px)** | **60.15%** | **28.84%** | 71.18% | 66.86% | 2.4 FPS | Recommended only if CUDA GPU is active |
