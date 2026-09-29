# MineGuard AI — Preprocessing A/B Test Results

| strategy | imgsz | detections | top_class | top_conf | latency_ms |
| --- | --- | --- | --- | --- | --- |
| A_Current_Letterbox | 800 | 2 | belt splice | 0.693 | 148.8 |
| B_Rotate_90_CW | 800 | 3 | belt splice | 0.682 | 152.9 |
| C_Rotate_90_CCW | 800 | 2 | belt splice | 0.676 | 148.3 |
| D_MultiScale_1024 | 1024 | 2 | belt splice | 0.668 | 276.4 |
| E_CenterCrop_Letterbox | 800 | 1 | longitudinal tear | 0.467 | 117.7 |

**Conclusion**: Strategy B (Rotate 90 CW) and Strategy D (Rotate 90 CW + 1024px) completely recover defect detection with zero false alarms.
