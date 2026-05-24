# GOEUN dev server — run in PowerShell, keep window open
Set-Location $PSScriptRoot
$ip = (wsl hostname -I).Trim().Split()[0]
Write-Host ""
Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  Dev URLs (use WSL IP — localhost may fail)" -ForegroundColor Cyan
Write-Host "  http://${ip}:3005/" -ForegroundColor Green
Write-Host "  http://${ip}:3005/energy-dashboard-login" -ForegroundColor Green
Write-Host "  Keep this window open. Ctrl+C to stop." -ForegroundColor Yellow
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""
wsl -e bash -lc "cd ~/web && npm run dev"
