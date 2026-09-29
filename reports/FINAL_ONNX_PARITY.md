# Final ONNX Export & Parity Verification Report
**SIH 26008: Jetson Edge Deployment Readiness**

## 1. Export Metadata
- **Source PyTorch Checkpoint**: `models/final_sih_model.pt` (18.32 MB)
- **ONNX Export Artifact**: `models/final_sih_model.onnx` (36.27 MB)
- **ONNX Version**: 1.22.0 | **Opset**: 18
- **Optimization**: onnxslim 0.1.96 graph constant-folding & redundant operator elimination

## 2. Numerical Parity Analysis
- **PyTorch Detected Boxes**: 2
- **ONNX Runtime Detected Boxes**: 2
- **Class Match**: True ([np.int64(0), np.int64(2)] vs [np.int64(0), np.int64(2)])
- **Max Absolute Coordinate Difference**: 0.000000 pixels
- **Mean Absolute Coordinate Difference**: 0.000000 pixels
- **Max Absolute Confidence Difference**: 0.000000
- **Parity Verdict**: **PASS (100% Logical & Numerical Consistency within IEEE-754 FP32 tolerances)**

## 3. Deployment Speed Benchmarks
- **PyTorch CPU Latency**: 168.2 ms
- **ONNX Runtime CPU Latency (measured)**: **138.3 ms** (~18% acceleration over PyTorch CPU)
- **NVIDIA Jetson Orin Nano (TensorRT FP16, projected)**: **~8.4 ms (>110 FPS)**
