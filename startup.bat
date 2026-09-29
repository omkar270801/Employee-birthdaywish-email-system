@echo off
title Birthday Wish Email System
echo ========================================
echo  Birthday Wish Email System - Starting...
echo ========================================
echo.

set "PROJECT_ROOT=%~dp0"
set "SERVER_DIR=%PROJECT_ROOT%server"
set "CLIENT_DIR=%PROJECT_ROOT%client"

REM Add common Node.js installation paths to PATH
set "PATH=%PATH%;C:\Program Files\nodejs;C:\Program Files (x86)\nodejs;%LOCALAPPDATA%\Programs\nodejs"

echo Checking Node.js...
node --version
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH.
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Checking npm...
REM Try to run npm via PowerShell if cmd doesn't work
powershell -Command "npm --version" >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not available.
    echo Please ensure Node.js is properly installed.
    pause
    exit /b 1
)

echo Node.js and npm are available.
echo.

echo.
echo Checking server dependencies...
if not exist "%SERVER_DIR%\node_modules" (
    echo Installing server dependencies...
    pushd "%SERVER_DIR%"
    powershell -Command "npm install"
    if errorlevel 1 (
        echo ERROR: Failed to install server dependencies.
        pause
        exit /b 1
    )
    popd
) else (
    echo Server dependencies already installed.
)

echo.
echo Checking client dependencies...
if not exist "%CLIENT_DIR%\node_modules" (
    echo Installing client dependencies...
    pushd "%CLIENT_DIR%"
    powershell -Command "npm install"
    if errorlevel 1 (
        echo ERROR: Failed to install client dependencies.
        pause
        exit /b 1
    )
    popd
) else (
    echo Client dependencies already installed.
)

echo.
echo Starting servers...
echo Backend: http://localhost:5001
echo Frontend: http://localhost:5173
echo.

REM Start backend server using PowerShell
start "Birthday Backend" powershell -NoExit -Command "cd '%SERVER_DIR%'; npm run dev"
timeout /t 5 /nobreak >nul

REM Start frontend server using PowerShell
start "Birthday Frontend" powershell -NoExit -Command "cd '%CLIENT_DIR%'; npm run dev"
timeout /t 10 /nobreak >nul

REM Try to open browser with multiple methods
echo Opening browser...
powershell -Command "Start-Process http://localhost:5173"
timeout /t 2 /nobreak >nul
start "" http://localhost:5173

echo.
echo ========================================
echo Servers are starting in separate windows.
echo ========================================
echo Backend:  http://localhost:5001
echo Frontend: http://localhost:5173
echo.
echo If browser doesn't open automatically:
echo 1. Wait 10-15 seconds for servers to start
echo 2. Manually open: http://localhost:5173
echo 3. Check the "Birthday Frontend" window for errors
echo ========================================
echo.
echo Press any key to close this window (servers will continue running)...
pause >nul
