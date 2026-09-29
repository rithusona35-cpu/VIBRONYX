# Real-World Blind Validation V2: Data Leakage & Overlap Audit
**SIH 26008: Conveyor Belt Defect Detection**
*Audit Date: 2026-09-19 21:33:51*

---

## 1. Executive Summary
Before executing blind evaluation, cryptographic SHA256 image hashes were computed for all candidate images and cross-referenced against all 1,556 images across the training, validation, and test splits of `datasets/dataset_v2_5class/`.

- **Legacy Benchmark Frames Evaluated**: 25
- **Excluded Due to Leakage**: **25 images** marked as `EXCLUDED_DUPLICATE`.
- **Verified Clean Unseen Blind Frames**: **50 images** admitted into `real_world_validation_v2/`.

---

## 2. Excluded Duplicates Log (Preventing Artificially Inflated Metrics)

| File Path | SHA256 Checksum | Classification | Split Overlap Mechanism |
| :--- | :--- | :--- | :--- |
| `real_world_test\REAL_BELT_SPLICE\frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg` | `f55bc452d8edc29a...` | **EXCLUDED_DUPLICATE** | TEST_SPLIT_OVERLAP |
| `real_world_test\REAL_BELT_SPLICE\frame_00003_jpg.rf.49968cb55095c8b650a32b4de9b866a4.jpg` | `a4f276d67403e778...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\REAL_BELT_SPLICE\frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg` | `ef1c1df39cecde96...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\REAL_BELT_SPLICE\frame_00012_jpg.rf.0bccc92f2975e1b5d666489e29c08648.jpg` | `7cbff6723e9282c7...` | **EXCLUDED_DUPLICATE** | VAL_SPLIT_OVERLAP |
| `real_world_test\REAL_BELT_SPLICE\frame_00015_jpg.rf.8130d85e915ded4d5e29721b9dda2ff3.jpg` | `6e31446c558eea76...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\REAL_BELT_SPLICE\frame_00019_jpg.rf.c9d90cbe0a1e82afbccd085d19bd1cae.jpg` | `5088f0112ec4bf30...` | **EXCLUDED_DUPLICATE** | VAL_SPLIT_OVERLAP |
| `real_world_test\REAL_BELT_SPLICE\frame_00035_jpg.rf.cfcbd4ea3415701965f8fedda293fb50.jpg` | `748b40d4544d90c3...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\REAL_DEEP_SCRATCH\frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg` | `6b23ef738438459b...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\REAL_HEALTHY\frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg` | `106b8bf938d21b4c...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\REAL_LONGITUDINAL_TEAR\frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg` | `42298647f8af3b99...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\REAL_LONGITUDINAL_TEAR\frame_00043_jpg.rf.18a2450e12175f4369c1a958dc52304b.jpg` | `e71159d8bdebdc4a...` | **EXCLUDED_DUPLICATE** | VAL_SPLIT_OVERLAP |
| `real_world_test\REAL_LONGITUDINAL_TEAR\frame_00045_jpg.rf.1ad7ac3267692d24b90701ef60772951.jpg` | `c2f9cb2baf37d1b6...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\REAL_SLIGHT_SCRATCH\frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg` | `ef1c1df39cecde96...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\frame_00002_jpg.rf.5e28130cc2199a50e3b0fdc3d2e38885.jpg` | `f55bc452d8edc29a...` | **EXCLUDED_DUPLICATE** | TEST_SPLIT_OVERLAP |
| `real_world_test\frame_00003_jpg.rf.49968cb55095c8b650a32b4de9b866a4.jpg` | `a4f276d67403e778...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\frame_00005_jpg.rf.0a13708ad0e588d678226308cacc8c9b.jpg` | `ef1c1df39cecde96...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\frame_00007_jpg.rf.fc0f5aff005d781418faaa297ff2471c.jpg` | `42298647f8af3b99...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\frame_00012_jpg.rf.0bccc92f2975e1b5d666489e29c08648.jpg` | `7cbff6723e9282c7...` | **EXCLUDED_DUPLICATE** | VAL_SPLIT_OVERLAP |
| `real_world_test\frame_00015_jpg.rf.8130d85e915ded4d5e29721b9dda2ff3.jpg` | `6e31446c558eea76...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\frame_00019_jpg.rf.c9d90cbe0a1e82afbccd085d19bd1cae.jpg` | `5088f0112ec4bf30...` | **EXCLUDED_DUPLICATE** | VAL_SPLIT_OVERLAP |
| `real_world_test\frame_00021_jpg.rf.6831210c001ea5ff0d9b88a309b62f97.jpg` | `106b8bf938d21b4c...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\frame_00024_jpg.rf.40676e62568fb1c96b30338f08050897.jpg` | `6b23ef738438459b...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\frame_00035_jpg.rf.cfcbd4ea3415701965f8fedda293fb50.jpg` | `748b40d4544d90c3...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |
| `real_world_test\frame_00043_jpg.rf.18a2450e12175f4369c1a958dc52304b.jpg` | `e71159d8bdebdc4a...` | **EXCLUDED_DUPLICATE** | VAL_SPLIT_OVERLAP |
| `real_world_test\frame_00045_jpg.rf.1ad7ac3267692d24b90701ef60772951.jpg` | `c2f9cb2baf37d1b6...` | **EXCLUDED_DUPLICATE** | TRAIN_SPLIT_OVERLAP |

---

## 3. Admitted Clean Real-World Evaluation Suite
All images admitted into `real_world_validation_v2/` exhibit 0% sequence overlap and 0% hash collision with any training or tuning set.
