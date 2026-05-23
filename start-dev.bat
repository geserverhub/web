@echo off
title GOEUN Dev Server - port 3005
cd /d "%~dp0"
echo.
echo ============================================
echo   GOEUN SERVER HUB - Dev Server (WSL)
echo ============================================
echo.
for /f "tokens=1" %%i in ('wsl hostname -I') do set WSL_IP=%%i
echo   Windows localhost often FAILS with WSL dev.
echo   Use this URL in your browser:
echo.
echo     http://%WSL_IP%:3005/
echo.
echo   Energy login: http://%WSL_IP%:3005/energy-dashboard-login
echo.
echo   Keep THIS window open while developing.
echo   Press Ctrl+C to stop the server.
echo ============================================
echo.
wsl -e bash -lc "cd ~/web && npm run dev"
