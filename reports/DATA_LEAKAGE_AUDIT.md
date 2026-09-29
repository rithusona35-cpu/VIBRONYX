# MINEGUARD AI — DATA LEAKAGE & DUPLICATE AUDIT REPORT
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**  

---

## 1. Audit Summary
- **Exact Duplicate Groups:** 1661
- **Cross-Partition Leakage Events:** 236
- **Near-Duplicate Groups:** 377

## 2. Cross-Partition Leakage Details
| Leakage Type | Source File | Matching Files |
| :--- | :--- | :--- |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00003_jpg.rf.49968cb55095c8b650a32b4de9b866a4.jpg` | `10 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg` | `9 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg` | `8 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00015_jpg.rf.8130d85e915ded4d5e29721b9dda2ff3.jpg` | `9 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg` | `9 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg` | `10 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00035_jpg.rf.cfcbd4ea3415701965f8fedda293fb50.jpg` | `7 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00045_jpg.rf.1ad7ac3267692d24b90701ef60772951.jpg` | `7 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00046_jpg.rf.9075689b3baa501f6d8d9f1d91930a32.jpg` | `4 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00052_jpg.rf.28706526d8f19576dc058ac9629bc90a.jpg` | `4 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00055_jpg.rf.21c7dbe8fddf9f4b645d945f63c435b2.jpg` | `4 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00068_jpg.rf.7da2953212e752b7957050e8ee29e21a.jpg` | `4 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00121_jpg.rf.35938fe6d80f1299c994e9cb2adbac77.jpg` | `5 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/train/images/frame_00129_jpg.rf.7719d1d835cab947ea466cdf7469001a.jpg` | `4 occurrences` |
| `VAL_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/val/images/frame_00012_jpg.rf.0bccc92f2975e1b5d666489e29c08648.jpg` | `10 occurrences` |
| `VAL_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/val/images/frame_00019_jpg.rf.c9d90cbe0a1e82afbccd085d19bd1cae.jpg` | `9 occurrences` |
| `VAL_TEST_LEAKAGE` | `datasets/dataset_v2_4defect/val/images/frame_00043_jpg.rf.18a2450e12175f4369c1a958dc52304b.jpg` | `8 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_5class/train/images/frame_00003_jpg.rf.49968cb55095c8b650a32b4de9b866a4.jpg` | `10 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_5class/train/images/frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg` | `9 occurrences` |
| `TRAIN_TEST_LEAKAGE` | `datasets/dataset_v2_5class/train/images/frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg` | `8 occurrences` |

## 3. Near-Duplicate & Video Frame Leakage Analysis
Sequential video frames from conveyor test recordings often exhibit near-identical backgrounds with hamming distances $\le 3$.
To prevent optimistic evaluation bias:
1. Training datasets must group video sequences by physical recording session.
2. The blind real-world test set (`real_world_test/`) must remain completely separate from training partitions.
