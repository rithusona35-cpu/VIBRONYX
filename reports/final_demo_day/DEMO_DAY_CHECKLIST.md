# MINEGUARD AI — FINAL DEMO-DAY ACTION CHECKLIST
**SIH Problem Statement 26008:** AI-Based Industrial Conveyor Belt Defect Detection and Monitoring System

---

## 1. Pre-Flight Setup (5 Minutes Before Judges Arrive)

- [ ] **Close Background Apps:** Ensure Zoom, Microsoft Teams, Windows Camera App, and any heavy browsers are closed so DirectShow camera and CPU threads are 100% dedicated.
- [ ] **Open PowerShell Terminal in Project Directory:**
  ```powershell
  cd C:\Users\AnbuRithu\Downloads\yolo_output
  ```
- [ ] **Verify Model Checksum (Integrity Gate):**
  ```powershell
  (Get-FileHash models/final_sih_model.pt -Algorithm SHA256).Hash
  ```
  *Expected:* `2620A198ED5729D20B0B2DBC9325B4EC135732E596FED5B6A4645CEA2C9F5EB3`

---

## 2. Launching the System

- [ ] **Run One-Command Batch Launcher:**
  ```cmd
  run_final_sih_demo.bat
  ```
  *Or PowerShell equivalent:*
  ```powershell
  .\run_final_sih_demo.ps1
  ```
- [ ] **Check Automated Startup Output:**
  ```text
  MODEL INTEGRITY: PASS
  ENVIRONMENT: PASS
  SAFETY SIMULATION: ENABLED
  SERVER: STARTING
  ```
- [ ] **Confirm Browser Viewport:** Dashboard automatically loads at `http://127.0.0.1:5000`.

---

## 3. During the Judge Demonstration (14-Step Script)

| Sequence | Step | What to Click / Present | Expected Display |
| :---: | :--- | :--- | :--- |
| **1** | System Startup | Point to Header & Telemetry | `SYSTEM_READY`, `SIMULATION MODE`, `YOLO11s 800x800` |
| **2** | Clean Belt | Select `01_clean` | `NO_DETECTIONS`, Green Status, Motor `RUNNING` |
| **3** | Slight Scratch | Select `02_slight_scratch` | `WARNING`, Yellow Bounding Box, `ALERT` (No Stop) |
| **4** | Deep Scratch | Select `03_deep_scratch` | `WARNING`, Deep Gouge Box, Maintenance Logged |
| **5** | Longitudinal Tear | Select `04_longitudinal_tear` | `CRITICAL`, Red Alert, `STOP_CONVEYOR`, `LATCHED` |
| **6** | Belt Splice | Select `05_belt_splice` | `CRITICAL`, Mechanical Joint Box, Emergency Halt |
| **7** | Portrait Mismatch | Select `06_portrait_recovery` | Baseline: 0 Dets vs Router: 1 Det Recovered |
| **8** | Router Telemetry | Point to Multi-View Card | Evaluated angles `[0°, 90°, 270°]`, Canonical 270° |
| **9** | BBox Inverse Parity | Point to Bounding Box | Transformed coordinates mapped to native image |
| **10**| Latch Interlock | Feed `01_clean` while latched | Conveyor **REMAINS STOPPED** (Auto-restart prohibited) |
| **11**| Unauthorized Reset | Point to Latch Indicator | Unauthenticated actions cannot clear safety latch |
| **12**| Authorized Reset | Click **"Reset Safety Latch"** | Latch cleared $\rightarrow$ State: `SYSTEM_READY` |
| **13**| Resume Operation | Feed `01_clean` | Conveyor restarts safely $\rightarrow$ Action: `CONTINUE` |
| **14**| Live Camera Demo | Click **"Start Live Camera"** | DirectShow Index 0 live stream with subpixel inference |

---

## 4. Emergency Recovery Procedures

| Symptom | Cause | One-Command Fix |
| :--- | :--- | :--- |
| **Port 5000 Already in Use** | Old background Python process | `Get-Process python -ErrorAction SilentlyContinue \| Stop-Process -Force` |
| **Camera Won't Open** | Camera occupied by Teams/Zoom | Close competing apps, re-run `run_final_sih_demo.bat` |
| **Model Checksum Warning** | Accidental file touch | `Copy-Item backup\sih_final_frozen_backup\models\final_sih_model.pt models\ -Force` |
| **Regression Verification** | Judge asks for test proof | `.\venv\Scripts\python -m unittest discover tests` (Ran 63 tests ... OK) |
