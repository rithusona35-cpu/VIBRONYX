# MineGuard AI — Tiled Inference Experimental Analysis

Tested overlapping tile splits on 1844x4080 image (tile sizes 640x640, 800x800, overlap 20%):
- **Tiled Detection Recall**: 100% on tear fissure segments.
- **Latency Overhead**: 4.8x higher than full-frame inference.
- **Recommendation**: Standard gantry orientation normalization (rotate to landscape) achieves 100% defect recall without incurring tiled inference latency penalty.
