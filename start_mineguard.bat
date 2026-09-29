@echo off
title MineGuard AI - Industrial SCADA & Safety Controller
color 0A
echo ==============================================================================
echo   MineGuard AI: Intelligent Conveyor Belt Defect Detection and Safety System
echo   SIH 26008 - Full-Stack Local Web Platform
echo ==============================================================================
echo.
cd /d "%~dp0"
echo [1/3] Verifying Python runtime...
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [!] Python 3.8+ not detected in PATH!
    pause
    exit /b 1
)
echo [2/3] Installing/verifying dependencies...
python -m pip install flask flask-cors pillow numpy opencv-python torch ultralytics pyserial --quiet
echo [3/3] Starting MineGuard AI Server on http://127.0.0.1:5000/ ...
start http://127.0.0.1:5000/
python app.py
pause