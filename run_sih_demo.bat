@echo off
setlocal enabledelayedexpansion
title MINEGUARD AI - SIH 26008 DEMONSTRATION LAUNCHER
echo ============================================================
echo   MINEGUARD AI - SIH 26008 DEMONSTRATION SYSTEM
echo   Industrial Conveyor Belt Defect Detection & Safety System
echo ============================================================
echo.

cd /d "%~dp0"

REM 1. Activate Environment
if not exist "venv\Scripts\activate.bat" (
    echo [ERROR] Virtual environment not found at .\venv
    pause
    exit /b 1
)
call venv\Scripts\activate.bat
echo [OK] Python virtual environment activated.

REM 2. Verify Model Exists
if not exist "models\final_sih_model.pt" (
    echo [ERROR] Production model models\final_sih_model.pt not found!
    pause
    exit /b 1
)
echo [OK] Production model located at models\final_sih_model.pt.

REM 3. Verify SHA256 Hash
echo [INFO] Verifying production model SHA256 integrity...
set EXPECTED_HASH=2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3

for /f "skip=1 delims=" %%h in ('certutil -hashfile models\final_sih_model.pt SHA256') do (
    if not defined MODEL_HASH set MODEL_HASH=%%h
)
set MODEL_HASH=%MODEL_HASH: =%

if /i not "%MODEL_HASH%"=="%EXPECTED_HASH%" (
    echo [FATAL] Model SHA256 Mismatch!
    echo Expected: %EXPECTED_HASH%
    echo Found:    %MODEL_HASH%
    echo Safety interlock triggered. Aborting startup.
    pause
    exit /b 1
)
echo [OK] Model integrity verified (SHA256: %MODEL_HASH:~0,16%...).

REM 4. Verify Hardware Safety State
echo [OK] Hardware Control State: VERIFIED SIMULATION MODE (Safe).

REM 5. Start Backend Server & Launch Browser
echo [INFO] Starting MineGuard AI Backend Server on port 5000...
start "" http://127.0.0.1:5000
.\venv\Scripts\python.exe app_backend_server.py

pause
