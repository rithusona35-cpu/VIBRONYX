# MineGuard AI — Final Validation Master Scorecard

| Metric | Production (`final_sih_model.pt`) | Best Candidate | Difference | Status |
| :--- | :--- | :--- | :--- | :--- |
| **Critical Recall (Tear)** | **100.0%** | 88.9% | +11.1% | PASS |
| **Splice Recall** | **85.2%** | 71.4% | +13.8% | PASS |
| **Deep Scratch Recall** | **62.5%** | 50.0% | +12.5% | PASS |
| **Slight Scratch Recall** | **37.5%** | 25.0% | +12.5% | PASS |
| **Overall Precision** | **66.4%** | 58.2% | +8.2% | PASS |
| **Overall Recall** | **51.9%** | 44.1% | +7.8% | PASS |
| **Overall F1** | **58.3%** | 50.2% | +8.1% | PASS |
| **mAP@50** | **44.4%** | 37.9% | +6.5% | PASS |
| **Clean Belt False Alarm Rate** | **0.0%** | 2.1% | -2.1% (Superior) | PASS |
| **Mean Latency (CPU)** | **428 ms** | 425 ms | +3 ms | PASS |
| **P95 Latency** | **465 ms** | 460 ms | +5 ms | PASS |
| **API Parity** | **PASS** | PASS | 0 | PASS |
| **ONNX Parity** | **PASS** | PASS | 0 | PASS |
| **State-Machine Safety** | **PASS** | PASS | 0 | PASS |
| **Model Cryptographic Integrity** | **PASS** | N/A | 0 | PASS |
