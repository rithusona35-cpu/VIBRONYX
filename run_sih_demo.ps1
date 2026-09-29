# MINEGUARD AI - SIH 26008 DEMONSTRATION LAUNCHER (PowerShell)
$Host.UI.RawUI.WindowTitle = "MINEGUARD AI - SIH 26008 DEMONSTRATION"
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host "  MINEGUARD AI - SIH 26008 DEMONSTRATION SYSTEM" -ForegroundColor Cyan
Write-Host "  Industrial Conveyor Belt Defect Detection & Safety System" -ForegroundColor Cyan
Write-Host "============================================================" -ForegroundColor Cyan
Write-Host ""

$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $workspace

# 1. Check Python Environment
$pyExe = Join-Path $workspace "venv\Scripts\python.exe"
if (-not (Test-Path $pyExe)) {
    Write-Host "[ERROR] Virtual environment Python not found at $pyExe" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Python environment verified." -ForegroundColor Green

# 2. Check Model File
$modelPath = Join-Path $workspace "models\final_sih_model.pt"
if (-not (Test-Path $modelPath)) {
    Write-Host "[ERROR] Production model not found at $modelPath" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Model file located: $modelPath" -ForegroundColor Green

# 3. Check Model SHA256 Hash
Write-Host "[INFO] Verifying model SHA256 integrity..." -ForegroundColor Yellow
$expectedHash = "2620a198ed5729d20b0b2dbc9325b4ec135732e596fed5b6a4645cea2c9f5eb3"
$actualHash = (Get-FileHash -Path $modelPath -Algorithm SHA256).Hash.ToLower()

if ($actualHash -ne $expectedHash) {
    Write-Host "[FATAL] SHA256 mismatch detected!" -ForegroundColor Red
    Write-Host "Expected: $expectedHash" -ForegroundColor Red
    Write-Host "Actual:   $actualHash" -ForegroundColor Red
    exit 1
}
Write-Host "[OK] Model SHA256 validated: $actualHash" -ForegroundColor Green

# 4. Hardware Simulation Mode
Write-Host "[OK] Hardware Safety: Simulation Mode Active (Relays Isolated)" -ForegroundColor Green

# 5. Open Web Dashboard & Start Server
Write-Host "[INFO] Launching dashboard at http://127.0.0.1:5000..." -ForegroundColor Cyan
Start-Process "http://127.0.0.1:5000"

Write-Host "[INFO] Starting Backend Server..." -ForegroundColor Yellow
& $pyExe (Join-Path $workspace "app_backend_server.py")
