# MINEGUARD AI — PREPROCESSING FORENSIC REPORT
**SIH 26008: AI-Based Industrial Conveyor Belt Defect Detection and Monitoring**  

---

## 1. Pipeline Verification
Forensic audit of `unified_preprocessor.py`, `app_backend_server.py`, and `hardware_controller.py`:
- **EXIF Transposition:** Correctly checks `ImageOps.exif_transpose(pil_img)`.
- **Channel Format:** Strips alpha/grayscale and converts to 3-channel RGB.
- **Letterbox Padding:** Preserves aspect ratio with constant (114, 114, 114) border padding.
- **Stride Alignment:** Ultralytics internally enforces 32-pixel stride compatibility.

## 2. Identified Vulnerability: Aspect Ratio & Orientation
When mobile phone camera images with non-standard aspect ratios ($1:2.2$) are ingested:
- High downsampling factor ($5.1	imes$) destroys fine crack features.
- Model receptive field expects horizontal belt orientation.
- **Recommended Solution:**
  1. Add automatic orientation alignment in industrial ingestion pipeline (or automatic $90^\circ$ aspect ratio check).
  2. Implement tiled / sliding window inference for ultra-high-resolution or extreme aspect ratio images.
