import shutil, os

base_yolo = r'c:\Users\AnbuRithu\Downloads\yolo_output'
base_web = r'C:\Users\AnbuRithu\Downloads\ullas website\MineGuard_AI_Conveyor_System'

for doc in ['README_MINEGUARD_LOCAL.md', 'INTEGRATION_STATUS.md']:
    s = os.path.join(base_yolo, doc)
    d = os.path.join(base_web, doc)
    shutil.copy2(s, d)
    print(f'Copied {doc} -> {d}')

bat_lines = [
    "@echo off",
    "title MineGuard AI - Industrial SCADA & Safety Controller",
    "color 0A",
    "echo ==============================================================================",
    "echo   MineGuard AI: Intelligent Conveyor Belt Defect Detection and Safety System",
    "echo   SIH 26008 - Full-Stack Local Web Platform",
    "echo ==============================================================================",
    "echo.",
    'cd /d "%~dp0"',
    "echo [1/3] Verifying Python runtime...",
    "python --version >nul 2>&1",
    "if %errorlevel% neq 0 (",
    "    echo [!] Python 3.8+ not detected in PATH!",
    "    pause",
    "    exit /b 1",
    ")",
    "echo [2/3] Installing/verifying dependencies...",
    "python -m pip install flask flask-cors pillow numpy opencv-python torch ultralytics pyserial --quiet",
    "echo [3/3] Starting MineGuard AI Server on http://127.0.0.1:5000/ ...",
    "start http://127.0.0.1:5000/",
    "python app.py",
    "pause"
]
bat_content = "\n".join(bat_lines)

with open(os.path.join(base_web, 'start_mineguard.bat'), 'w', encoding='utf-8') as f:
    f.write(bat_content)
with open(os.path.join(base_yolo, 'start_mineguard.bat'), 'w', encoding='utf-8') as f:
    f.write(bat_content)
with open(r'C:\Users\AnbuRithu\Downloads\ullas website\run.bat', 'w', encoding='utf-8') as f:
    f.write('@echo off\ncd /d "%~dp0\\MineGuard_AI_Conveyor_System"\ncall start_mineguard.bat\n')

print('Created start_mineguard.bat and root run.bat successfully!')
