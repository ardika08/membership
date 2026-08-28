@echo off
title Grafista Frontend (Vite) - biarkan jendela ini terbuka
cd /d "%~dp0"
echo ================================================
echo  Grafista Digital - Frontend
echo  http://localhost:5173
echo  Jangan tutup jendela ini selama development.
echo ================================================
echo.
call npm run dev
pause
