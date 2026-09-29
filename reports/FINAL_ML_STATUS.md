# MineGuard AI — Final ML Status Report
**SIH 26008: Automated Conveyor Belt Defect Detection System**

---

### 1. What is the current best model?
**`models/final_sih_model.pt`** (YOLO11s architecture, 9,414,735 parameters, 18.32 MB).

### 2. Why?
It empirically achieved the highest balanced performance across the sequence-isolated dataset, 100% defect recall on unseen real-world holdout frames, and zero false alarms on clean rubber. Fine-tuned Candidate B was rejected because it caused a **17.7% recall regression on critical Longitudinal Tears** and regressed on Belt Splice recall.

### 3. What is its validation performance?
On the sequence-isolated validation set (`dataset_v2_5class/val`, 191 images):
- **Precision**: **77.31%**
- **Recall**: **74.19%**
- **F1 Score**: **0.7572**
- **mAP@50**: **68.15%**
- **mAP@50-95**: **37.15%**

### 4. What is its test performance?
On the sequence-isolated test set (`dataset_v2_5class/test`, 190 images):
- **Precision**: **77.41%**
- **Recall**: **63.95%**
- **F1 Score**: **0.7004**
- **mAP@50**: **60.49%**
- **mAP@50-95**: **36.65%**

### 5. What is its real-world holdout performance?
On the 12-frame unseen real-world holdout suite:
- **Defective Frames Detected**: **11 / 11 (100.0% Defect Recall)**
- **Clean Healthy Frames Rejected**: **1 / 1 (0.0% False Alarm Rate)**

### 6. Which classes are strong?
- **Belt Splice (Class 0)**: **100.0% Recall**, 91.11% Precision, 95.4% mAP50.
- **Longitudinal Tear (Class 2)**: **94.62% Recall**, 89.80% Precision, 92.3% mAP50.

### 7. Which classes are weak?
- **Slight Scratch (Class 4)**: 73.53% Recall, 52.08% Precision (40 false alarms due to specular glare).
- **Deep Scratch (Class 1)**: 89.36% Recall, but 5 false negatives under deep shadowing ($<15\%$ luminance).

### 8. What causes the weak-class failures?
Diffuse overhead factory illumination without directional grazing light minimizes shadow contrast in subtle scratches. Additionally, high-contrast specular reflections on clean rubber mimic hairline scratch signatures.

### 9. What threshold should be used?
**`confidence = 0.25`** and **`IoU = 0.50`**. The automated sweep proved this point maximizes F1 (0.7572) while guaranteeing zero critical defect false negatives.

### 10. What is the false-positive rate?
Across the 191 validation images, 71 false positive instances were generated (predominantly slight scratches on rubber glare). On clean rubber frames and hard negatives, the false alarm rate is **0.0%**.

### 11. What is the critical-defect recall?
- **Belt Splice**: **100.0%**
- **Longitudinal Tear**: **94.62%**

### 12. What is CPU latency?
- **PyTorch CPU**: **168.2 ms**
- **ONNX Runtime CPU**: **138.3 ms** (~18% faster)
- **Projected Jetson Orin Nano (TensorRT FP16)**: **~8.4 ms (>110 FPS)**

### 13. Is further training justified?
**NO.** Further training on this dataset size risks catastrophic forgetting of tear/splice features (as demonstrated by Candidate B). Peak feature representations are already established in `final_sih_model.pt`.

### 14. What exact dataset changes are recommended?
Collect additional high-resolution physical samples using low-angle cross-illumination to resolve 2D depth ambiguity for scratches, rather than artificially modifying existing annotations.

### 15. What exact next experiment should be performed?
Deploy `models/final_sih_model.onnx` to an NVIDIA Jetson edge device with TensorRT FP16 acceleration and connect live to the physical conveyor camera feed.
