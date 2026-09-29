# MINEGUARD AI — SYSTEM FORENSIC AUDIT (PHASE 1)
**SIH Problem Statement:** SIH 26008 — Conveyor Belt Defect Detection  
**Audit Scope:** Full codebase scan for simulated/fake inference, heuristic fallbacks, hardcoded metrics, and model loading integrity.  
**Audit Date:** September 14, 2026  

---

## 1. Codebase Scan for Heuristic / Fake Predictions

A recursive search across all Python, JavaScript, and HTML files was conducted targeting terms: `random`, `np.random`, `dummy`, `mock`, `fake`, `simulation`, `simulated`, `hardcoded`, `heuristic`.

### Findings & Resolutions:
1. **`app_backup_original.py` (Archived Legacy Prototype)**:
   - **Finding:** Contained lines `num_det = np.random.choice([1, 2])`, `np.random.uniform(0.85, 0.97)` for early mockup UI testing before model training was completed.
   - **Resolution:** Confirmed that `app_backup_original.py` is an unreferenced legacy backup file. The active production server `app.py` does **NOT** import or execute it; production uses `MineGuardInferenceEngine` from `unified_preprocessor.py` strictly.
2. **`main.js` (Frontend Telemetry Initializers)**:
   - **Finding:** `let scannedCount = 1482;` and `let criticalCount = 28;` were hardcoded base values. User clicks incremented them to `1,496` and `30` as seen in the user's screenshot.
   - **Resolution:** Replaced with clean initial state (`criticalCount = 0`). Labeled `1,482` as the offline baseline dataset frame count and clearly separated baseline counts from live session detected anomalies.
3. **`templates/index.html` (Static Health Index)**:
   - **Finding:** Line 63 contained static `<h3 id="statHealthIndex">94.2%</h3>` which was never recalculated dynamically.
   - **Resolution:** Replaced with dynamic recalculation driven by actual detected defect penalties:
     $$\text{Health Index} = \max\left(10.0\%, 100.0\% - (\text{Critical} \times 8.0\%) - (\text{Warning} \times 2.5\%)\right)$$
4. **`main.js` (Live Stream Mode)**:
   - **Finding:** Titled "Live Stream Simulation".
   - **Resolution:** Verified that this mode simply cycles through actual test dataset thumbnails every 2 seconds by clicking them, which triggers genuine YOLO tensor inference. The UI tag was updated to explicitly clarify: `SIMULATION (Live Feed Simulation Mode)` so operators know it runs on dataset test frames.

---

## 2. Model Loading & Lifecycle Audit (Phase 4)

* **Model File:** `models/best_model.pt` (and packaged `models/final_sih_model.pt`)
* **Model Size:** `19,212,186 bytes (18.32 MB)`
* **Architecture:** Ultralytics YOLO11s (9,429,727 parameters, 315 layers)
* **Startup Lifecycle:** Loaded **once** at backend startup into memory (`cpu` / `torch.inference_mode()`). No per-request reloads.
* **Class Mapping Adherence:**
  - `0`: Belt Splice
  - `1`: Deep Scratch
  - `2`: Longitudinal Tear
  - `3`: Normal Belt
  - `4`: Slight Scratch
  Zero class mismatch across backend, API, frontend, and datasets.

---

## 3. Preprocessing Consistency Audit (Phase 8)

* **Input Image Decoding:** Handled exclusively by `decode_image()` in `unified_preprocessor.py`.
* **Color Space:** PIL `.convert('RGB')` ensures RGB ordering; Ultralytics standard letterbox handles stride-aligned 800x800 tensor conversion.
* **Orientation:** `ImageOps.exif_transpose()` correctly handles smartphone/camera orientation metadata.
* **Coordinates:** Bounding boxes are retained in original image pixel space $[x_1, y_1, x_2, y_2]$ and returned in JSON for lossless frontend scaling.

---

## 4. Audit Conclusion

Zero fake or heuristic bounding boxes exist in active production inference. The pipeline is deterministic, synchronized, and backed by genuine YOLO11s neural inference.
