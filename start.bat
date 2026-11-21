@echo off
rem Digitális receptkönyv - indító Windowsra (dupla kattintással futtatható).
chcp 65001 >nul
cd /d "%~dp0"
title Digitális receptkönyv

where node >nul 2>nul
if %errorlevel% equ 0 goto run

echo.
echo   A Node.js nincs telepítve - ez szükséges a program futtatásához.
where winget >nul 2>nul
if %errorlevel% neq 0 goto manual
set ANSWER=n
set /p ANSWER="  Telepítsem most automatikusan (winget)? (i/n) "
if /i not "%ANSWER%"=="i" goto manual
winget install -e --id OpenJS.NodeJS.LTS --accept-source-agreements --accept-package-agreements
echo.
echo   A telepítés befejeződött. Zárd be ezt az ablakot, és indítsd újra a start.bat fájlt.
pause
exit /b 0

:manual
echo   Töltsd le és telepítsd az LTS verziót: https://nodejs.org/ - majd indítsd újra ezt a fájlt.
start "" "https://nodejs.org/"
pause
exit /b 1

:run
node scripts\launch.mjs
if %errorlevel% neq 0 pause
