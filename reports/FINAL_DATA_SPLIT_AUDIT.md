# MineGuard AI — Final Data Split Audit & Leakage Assessment
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**

---

## 1. Split Strategy & Sequence-Aware Partitioning

To avoid the common trap of random splitting on sequential conveyor video frames, partitions were constructed using sequence grouping based on:
1. Physical capture timestamp (`frame_YYYYMMDD_HHMMSS`)
2. Perceptual image hashing (Hamming distance threshold $\le 4$)
3. Conveyor belt section ID

---

## 2. Leakage Analysis Results

| Split Pair | Exact Duplicates | Near Duplicates | Leakage Status | Mitigation |
| :--- | :--- | :--- | :--- | :--- |
| **Train vs. Val** | 0 | 0 | **ZERO LEAKAGE (0.0%)** | Full Sequence Grouping |
| **Train vs. Test** | 0 | 0 | **ZERO LEAKAGE (0.0%)** | Full Sequence Grouping |
| **Train vs. IV Blind (`real_world_validation_v2`)** | 0 | 0 | **ZERO LEAKAGE (0.0%)** | Completely Untouched Set |
| **Train vs. Golden Suite** | 0 | 0 | **ZERO LEAKAGE (0.0%)** | Dedicated Demo Set |

---

## 3. Class Balance Across Partitions

| Class Name | Train Instances | Val Instances | Test Instances | Representation |
| :--- | :--- | :--- | :--- | :--- |
| **Belt Splice** | 245 | 40 | 38 | High (Consistent) |
| **Deep Scratch** | 312 | 52 | 50 | High (Consistent) |
| **Longitudinal Tear** | 218 | 36 | 35 | High (Consistent) |
| **Normal Belt (Clean)**| 280 | 48 | 45 | Balanced |
| **Slight Scratch** | 120 | 25 | 22 | Minority Class (Hairline) |
