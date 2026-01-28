@echo off
REM ==========================================
REM KSFP v2.0.0 - Quick Start Batch Script
REM ==========================================
REM This script sets up and runs KSFP with FRP tunneling

setlocal enabledelayedexpansion

echo.
echo ==========================================
echo KSFP v2.0.0 - Production Setup
echo ==========================================
echo.

REM Step 1: Check Node.js Installation
echo [1/5] Checking Node.js installation...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from: https://nodejs.org
    echo.
    pause
    exit /b 1
)
for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% detected
echo.

REM Step 2: Install Dependencies
echo [2/5] Installing backend dependencies...
cd /d i:\KSSFK\backend
if exist node_modules (
    echo ✓ Dependencies already installed
) else (
    echo Installing packages...
    call npm install --silent
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)
echo.

REM Step 3: Create .env file if missing
echo [3/5] Setting up environment configuration...
if exist .env (
    echo ✓ .env file already exists
) else (
    echo Creating .env file...
    (
        echo PORT=3000
        echo NODE_ENV=production
        echo DATABASE_URL=sqlite:./app.db
        echo JWT_SECRET=KSFP_v2_0_production_secret_key_2026
        echo JWT_EXPIRY=24h
        echo CORS_ORIGIN=*
        echo RATE_LIMIT=1000
    ) > .env
    echo ✓ .env file created
)
echo.

REM Step 4: Check FRP Tools
echo [4/5] Checking available FRP tools...
set FRP_AVAILABLE=0

echo Checking for Ngrok...
ngrok --version >nul 2>&1
if errorlevel 0 (
    echo ✓ Ngrok is available
    set FRP_AVAILABLE=1
) else (
    echo   Ngrok not found. Install from: https://ngrok.com
)

echo Checking for Cloudflare Tunnel...
cloudflared --version >nul 2>&1
if errorlevel 0 (
    echo ✓ Cloudflare Tunnel is available
    set FRP_AVAILABLE=1
) else (
    echo   Cloudflare Tunnel not found. Install from: https://developers.cloudflare.com
)

echo.

REM Step 5: Start Services
echo [5/5] Starting services...
echo ==========================================
echo.
echo ✓ Backend server starting on http://localhost:3000
echo.

REM Start backend in background
start "KSFP Backend Server" cmd /k "cd /d i:\KSSFK\backend && npm start"

REM Wait for backend to start
timeout /t 3 /nobreak

REM Show menu
:menu
cls
echo.
echo ==========================================
echo KSFP v2.0.0 - Services Running
echo ==========================================
echo.
echo Backend Server: http://localhost:3000
echo.
echo Available Actions:
echo.
echo 1. Start Ngrok Tunnel (port 3000)
echo 2. Start Cloudflare Tunnel
echo 3. Open Dashboard (http://localhost:3000/public/admin-dashboard.html)
echo 4. Open API Documentation
echo 5. Open School Finder
echo 6. View Server Logs
echo 0. Exit
echo.
set /p choice="Enter your choice (0-6): "

if "%choice%"=="1" goto ngrok
if "%choice%"=="2" goto cloudflare
if "%choice%"=="3" goto dashboard
if "%choice%"=="4" goto apidocs
if "%choice%"=="5" goto finder
if "%choice%"=="6" goto logs
if "%choice%"=="0" goto exit
echo Invalid choice. Please try again.
timeout /t 2
goto menu

:ngrok
echo.
echo Starting Ngrok tunnel...
echo Make sure Ngrok is authenticated: ngrok config add-authtoken YOUR_TOKEN
echo.
start "KSFP Ngrok Tunnel" cmd /k "ngrok http 3000"
timeout /t 2
goto menu

:cloudflare
echo.
echo Starting Cloudflare tunnel...
echo Make sure you have configured Cloudflare domain...
echo.
start "KSFP Cloudflare Tunnel" cmd /k "cloudflared tunnel run ksfp-demo --url http://localhost:3000"
timeout /t 2
goto menu

:dashboard
echo.
echo Opening Admin Dashboard...
start http://localhost:3000/public/admin-dashboard.html
timeout /t 2
goto menu

:apidocs
echo.
echo Opening API Documentation...
echo Check file: i:\KSSFK\API_DOCUMENTATION.md
echo Local URL: http://localhost:3000/API_DOCUMENTATION.md
start http://localhost:3000
timeout /t 2
goto menu

:finder
echo.
echo Opening School Finder...
start http://localhost:3000/public/school-finder-map.html
timeout /t 2
goto menu

:logs
echo.
echo Recent server logs:
if exist i:\KSSFK\logs\app.log (
    type i:\KSSFK\logs\app.log | tail -50
) else (
    echo No logs found yet. Server logs appear in the backend window.
)
echo.
pause
goto menu

:exit
echo.
echo ==========================================
echo Shutting down KSFP services...
echo ==========================================
echo.
taskkill /FI "WINDOWTITLE eq KSFP*" /T /F 2>nul
echo ✓ All KSFP services stopped
echo.
pause
exit /b 0
