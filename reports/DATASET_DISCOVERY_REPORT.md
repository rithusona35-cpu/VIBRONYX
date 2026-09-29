# MINEGUARD AI — DATASET DISCOVERY REPORT
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**  
**Audit Scope:** Full Recursive Workspace Discovery  
**Total Images Discovered:** 5372  

---

## 1. Summary of Discovered Assets
- **Total Image Files:** 5372
- **Unique SHA256 Hashes:** 2028
- **Exact Duplicate Groups:** 1661
- **Near-Duplicate Pairs:** 377

### Image Extension Distribution:
| Extension | Count |
| :--- | :--- |
| `.jpg` | 5279 |
| `.png` | 93 |

### Dataset Partition Distribution:
| Partition | Image Count |
| :--- | :--- |
| `train` | 3576 |
| `val` | 761 |
| `test` | 632 |
| `real_world_test` | 200 |
| `unpartitioned` | 165 |
| `experiment` | 24 |
| `demo` | 12 |
| `uploads` | 2 |

### Annotation Status Distribution:
| Annotation Status | Count |
| :--- | :--- |
| `ANNOTATED_YOLO` | 4378 |
| `UNANNOTATED` | 994 |

### Probable Class Distribution (Heuristic Path Discovery):
| Probable Class | Count |
| :--- | :--- |
| `Unknown / Unlabeled` | 3451 |
| `Normal Belt` | 1666 |
| `Deep Scratch` | 80 |
| `Belt Splice` | 70 |
| `Longitudinal Tear` | 54 |
| `Slight Scratch` | 51 |

---

## 2. Key Observations
1. **Curated Datasets:** Core YOLO splits (`train`, `valid`, `test`) contain standardized Roboflow format frames with bounding box annotations.
2. **Real-World Holdouts:** `real_world_test/`, `real_world_validation_v2/`, and `known_defect_tests/` hold blind industrial validation frames.
3. **Uploads & Demos:** `uploads/last_upload.jpg` preserves the most recent user dashboard inspection frame.
