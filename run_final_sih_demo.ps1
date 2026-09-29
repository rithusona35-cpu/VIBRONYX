# MINEGUARD AI - SIH FINAL DEMO MODE (PowerShell Launcher)
$Host.UI.RawUI.WindowTitle = "MINEGUARD AI - SIH FINAL DEMO MODE"

$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $workspace

# 1. Activate Environment & 2. Verify Python
$pyExe = Join-Path $workspace "venv\Scripts\python.exe"
if (-not (Test-Path $pyExe)) {
    Write-Host "[ERROR] Virtual environment Python not found at $pyExe" -ForegroundColor Red
    exit 1
}

# 3. Verify Required Packages
& $pyExe -c "import torch, ultralytics, cv2, flask, PIL, numpy; print('PACKAGES: OK')" 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "[ERROR] Missing required Python packages in environment!" -ForegroundColor Red
    exit 1
}

# 4. Verify Production Model Exists
$modelPath = Join-Path $workspace "models\final_sih_model.pt"
if (-not (Test-Path $modelPath)) {
    Write-Host "[ERROR] Production model not found at $modelPath" -ForegroundColor Red
    exit 1
}

# 5 & 6. Calculate & Compare SHA256 Hash
$expectedHash = "2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3"
$actualHash = (Get-FileHash -Path $modelPath -Algorithm SHA256).Hash.ToLower()

# 7. Refuse to start if model has changed
if ($actualHash -ne $expectedHash) {
    Write-Host "[FATAL] MODEL_INTEGRITY_FAILURE!" -ForegroundColor Red
    Write-Host "Expected: $expectedHash" -ForegroundColor Red
    Write-Host "Actual:   $actualHash" -ForegroundColor Red
    exit 1
}

# 8. Verify Required Directories
$dirs = @("uploads", "demo", "models", "reports")
foreach ($dir in $dirs) {
    $dirPath = Join-Path $workspace $dir
    if (-not (Test-Path $dirPath)) {
        New-Item -ItemType Directory -Path $dirPath | Out-Null
    }
}

# Display Required Freeze Banner
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "MINEGUARD AI" -ForegroundColor Cyan
Write-Host "SIH FINAL DEMO MODE" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "MODEL INTEGRITY: PASS" -ForegroundColor Green
Write-Host "ENVIRONMENT: PASS" -ForegroundColor Green
Write-Host "SAFETY SIMULATION: ENABLED" -ForegroundColor Green
Write-Host "SERVER: STARTING" -ForegroundColor Yellow
Write-Host ""

# 10. Open Dashboard
Start-Process "http://127.0.0.1:5000"

# 9. Start Server
& $pyExe (Join-Path $workspace "app_backend_server.py")
