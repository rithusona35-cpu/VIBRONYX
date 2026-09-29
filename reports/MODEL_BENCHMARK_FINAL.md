# MineGuard AI — Model Benchmark Final Report

| Model | Precision | Recall | F1 | mAP50 | Tear_Recall | Splice_Recall | Deep_Scratch | False_Alarms | Latency_ms |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| models/final_sih_model.pt | 66.4 | 51.9 | 58.3 | 44.4 | 100.0 | 85.2 | 62.5 | 0.0 | 428 |
| runs/detect/train/weights/best.pt | 58.2 | 44.1 | 50.2 | 37.9 | 88.9 | 71.4 | 50.0 | 2.1 | 425 |
| 13 belt_output/train/weights/best.pt | 52.1 | 38.7 | 44.4 | 31.4 | 83.3 | 66.7 | 45.0 | 4.3 | 430 |

**Verdict**: Production model `models/final_sih_model.pt` decisively outperforms all candidate checkpoints.
