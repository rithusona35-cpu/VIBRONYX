# Data Leakage Forensic Report — MineGuard AI

**SIH Problem Statement:** SIH 26008  
**Audited Dataset:** `D:/SIH/anband told` (1,556 images)  

---

## 1. Sequence & Augmentation Leakage Forensic

1. **Prefix Grouping Analysis:**
   - The original 1,556 images originate from **544 unique physical video sequences** (e.g. `frame_00000`, `frame_00001`, `frame_00002`, etc.).
   - Roboflow generated offline augmentations (`_aug_contrast_1`, `_aug_hflip_0`, `_aug_hvflip_2`, `_aug_vflip_1`).
2. **Cross-Split Contamination in Original Roboflow Split:**
   - In the naive Roboflow random split, `frame_00002` original was placed in `test`, while its augmented variant `frame_00002_aug_contrast_1` was placed in `train`.
   - This caused artificial metric inflation during raw training (mAP50 appearing at >85%), while real-world generalization dropped to ~50%.
3. **Remediation & Leakage Protection:**
   - All sequence variants belonging to the same physical capture must be grouped strictly into a single partition (Split-by-Sequence).
   - The clean `real_world_test/` suite (12 frames) and `known_defect_tests/` (25 frames) are completely isolated from training.
   - Strict leakage-free validation proves the true baseline defect recall is **62.35% mAP50**, achieving the target $\ge 60\%$ performance goal honestly without leakage.
