@echo off
title Grafista Backend API (Laravel) - biarkan jendela ini terbuka
cd /d "%~dp0backend"
echo ================================================
echo  Grafista Digital - Backend API
echo  http://localhost:8000/api
echo  Jangan tutup jendela ini selama development.
echo ================================================
echo.
php artisan serve
pause
