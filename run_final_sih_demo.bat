@echo off
setlocal enabledelayedexpansion
title MINEGUARD AI - SIH FINAL DEMO MODE

echo ============================================================
echo MINEGUARD AI
echo SIH FINAL DEMO MODE
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

REM 2. Verify Python
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python verification failed!
    pause
    exit /b 1
)

REM 3. Verify Required Packages
python -c "import torch, ultralytics, cv2, flask, PIL, numpy; print('PACKAGES: OK')" >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Missing required Python packages!
    pause
    exit /b 1
)

REM 4. Verify Production Model Exists
if not exist "models\final_sih_model.pt" (
    echo [ERROR] Production model models\final_sih_model.pt not found!
    pause
    exit /b 1
)

REM 5 & 6. Calculate & Verify SHA256 Hash
set EXPECTED_HASH=2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3

for /f "skip=1 delims=" %%h in ('certutil -hashfile models\final_sih_model.pt SHA256') do (
    if not defined MODEL_HASH set MODEL_HASH=%%h
)
set MODEL_HASH=%MODEL_HASH: =%

REM 7. Refuse to start if model has changed
if /i not "%MODEL_HASH%"=="%EXPECTED_HASH%" (
    echo [FATAL] MODEL_INTEGRITY_FAILURE!
    echo Expected: %EXPECTED_HASH%
    echo Found:    %MODEL_HASH%
    pause
    exit /b 1
)

REM 8. Verify Required Directories
if not exist "uploads" mkdir uploads
if not exist "demo" mkdir demo
if not exist "models" mkdir models

REM Display Standard Banner
echo MODEL INTEGRITY: PASS
echo ENVIRONMENT: PASS
echo SAFETY SIMULATION: ENABLED
echo SERVER: STARTING
echo.

REM 10. Open Dashboard
start "" http://127.0.0.1:5000

REM 9. Start Server
python app_backend_server.py

pause
