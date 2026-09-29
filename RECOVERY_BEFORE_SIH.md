# MINEGUARD AI — RAPID RECOVERY GUIDE BEFORE SIH
**SIH Problem Statement 26008:** AI-Based Industrial Conveyor Belt Defect Detection & Monitoring System

This document contains step-by-step restoration instructions if any technical failure occurs before or during the SIH Grand Finale demonstration.

> **CRITICAL PRESERVATION INVARIANT:**
> The production model checkpoint is `models/final_sih_model.pt`.
> Expected immutable SHA256:
> `2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3`
> A full frozen snapshot is preserved under `backup/sih_final_frozen_backup/`.

---

## 1. Scenario: Python Virtual Environment Breaks
**Symptoms:** `python` command missing, DLL load failures with PyTorch/OpenCV, or corrupted virtualenv.
**Recovery Steps:**
1. Open PowerShell in the project root: `C:\Users\AnbuRithu\Downloads\yolo_output`
2. Remove broken environment:
   ```powershell
   Remove-Item -Recurse -Force venv
   ```
3. Re-create virtual environment with Python 3.10:
   ```powershell
   py -3.10 -m venv venv
   ```
4. Activate the new environment:
   ```powershell
   .\venv\Scripts\Activate.ps1
   ```
5. Re-install locked dependencies from `requirements.txt`:
   ```powershell
   pip install --upgrade pip
   pip install -r requirements.txt
   ```
6. Verify package integrity:
   ```powershell
   python -c "import torch, ultralytics, cv2, flask, PIL, numpy; print('ENVIRONMENT RESTORED: OK')"
   ```

---

## 2. Scenario: Package Version Changes or Conflicts
**Symptoms:** `ImportError` or version incompatibility in `ultralytics` or `torch`.
**Recovery Steps:**
1. Check installed versions against the frozen baseline:
   - Python: `3.10.8`
   - PyTorch: `2.14.0`
   - TorchVision: `0.29.0`
   - Ultralytics: `8.4.138`
   - OpenCV: `5.0.0.93`
   - Flask: `3.1.3`
2. To reinstall exact frozen dependencies:
   ```powershell
   pip install torch==2.14.0 torchvision==0.29.0 --extra-index-url https://download.pytorch.org/whl/cpu
   pip install ultralytics==8.4.138 opencv-python==5.0.0.93 flask==3.1.3 pillow==12.3.0 numpy==2.2.6
   ```

---

## 3. Scenario: Production Model Checkpoint Accidentally Changed
**Symptoms:** `run_final_sih_demo.bat` or `.ps1` fails with `FATAL: MODEL_INTEGRITY_FAILURE` or SHA256 mismatch.
**Recovery Steps:**
1. Verify the current checksum:
   ```powershell
   (Get-FileHash models/final_sih_model.pt -Algorithm SHA256).Hash
   ```
2. If corrupted, restore directly from the immutable backup:
   ```powershell
   Copy-Item backup\sih_final_frozen_backup\models\final_sih_model.pt models\final_sih_model.pt -Force
   ```
3. Re-verify hash:
   ```powershell
   $h = (Get-FileHash models/final_sih_model.pt -Algorithm SHA256).Hash
   if ($h -eq "2620A198ED5729D20B0B2DBC9325B4EC135732E596FED5B6A4645CEA2C9F5EB3") {
       Write-Host "MODEL RESTORED SUCCESSFULLY!" -ForegroundColor Green
   }
   ```

---

## 4. Scenario: Port 5000 Is Occupied / Address Already in Use
**Symptoms:** `OSError: [Errno 10048] error while attempting to bind on address ('127.0.0.1', 5000): only one usage of each socket address is normally permitted`.
**Recovery Steps:**
1. Identify which PID is holding port 5000:
   ```powershell
   netstat -ano | findstr :5000
   ```
2. Terminate the lingering process (e.g. previous background instance):
   ```powershell
   Stop-Process -Id <PID_FOUND> -Force
   ```
3. Or kill all python backend instances:
   ```powershell
   Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*app_backend_server.py*" } | Stop-Process -Force
   ```
4. Re-launch `run_final_sih_demo.bat`.

---

## 5. Scenario: Camera Stops Working or Fails to Enumerate
**Symptoms:** `/api/camera/detect` returns 500 or DirectShow warning in console.
**Recovery Steps:**
1. Ensure no other application (Zoom, MS Teams, Windows Camera App, browser tab) is holding exclusive access to the webcam.
2. In Windows Settings -> Privacy & Security -> Camera -> Ensure **"Let desktop apps access your camera"** is set to **ON**.
3. Run the standalone camera test:
   ```powershell
   .\venv\Scripts\python -c "import cv2; cap = cv2.VideoCapture(0, cv2.CAP_DSHOW); ret, f = cap.read(); print('CAMERA CAPTURE:', ret); cap.release()"
   ```
4. If index 0 fails, test index 1 (external USB camera):
   ```powershell
   .\venv\Scripts\python -c "import cv2; cap = cv2.VideoCapture(1, cv2.CAP_DSHOW); ret, f = cap.read(); print('USB CAMERA:', ret); cap.release()"
   ```
5. If the camera is completely disconnected, the system safely operates in static demo mode via `/api/demo_step/<step_id>` or `demo/final_demo_images/`.

---

## 6. Scenario: Demo Configuration or Manifest Becomes Corrupted
**Symptoms:** Dashboard stepper fails to load steps or returns 404 on `/api/demo_manifest`.
**Recovery Steps:**
1. Restore manifest from backup:
   ```powershell
   Copy-Item backup\sih_final_frozen_backup\demo\* demo\ -Recurse -Force
   ```
2. Verify manifest valid JSON:
   ```powershell
   .\venv\Scripts\python -c "import json; json.load(open('demo/SIH_FINAL_DEMO_MANIFEST.json')); print('MANIFEST VALID')"
   ```

---

## 7. Scenario: Application Stops Starting or Crashing on Import
**Symptoms:** Traceback on startup in `app_backend_server.py`.
**Recovery Steps:**
1. Run quick syntax and import check:
   ```powershell
   .\venv\Scripts\python -m py_compile app_backend_server.py unified_preprocessor.py orientation_aware_fusion.py hardware_controller.py
   ```
2. Restore verified source files from backup:
   ```powershell
   Copy-Item backup\sih_final_frozen_backup\app_backend_server.py .\app_backend_server.py -Force
   Copy-Item backup\sih_final_frozen_backup\unified_preprocessor.py .\unified_preprocessor.py -Force
   Copy-Item backup\sih_final_frozen_backup\orientation_aware_fusion.py .\orientation_aware_fusion.py -Force
   Copy-Item backup\sih_final_frozen_backup\hardware_controller.py .\hardware_controller.py -Force
   ```
3. Run the full regression test suite to confirm 100% health:
   ```powershell
   .\venv\Scripts\python -m unittest discover tests
   ```
   *Expected: Ran 63 tests ... OK*
