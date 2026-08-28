@echo off
title Birthday Wish Email System
echo ========================================
echo  Birthday Wish Email System - Starting...
echo ========================================
echo.

set "PROJECT_ROOT=%~dp0"
set "SERVER_DIR=%PROJECT_ROOT%server"
set "CLIENT_DIR=%PROJECT_ROOT%client"

set "PATH=%PATH%;C:\Program Files\nodejs"

echo Checking Node.js...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH.
    pause
    exit /b 1
)

echo Checking npm...
npm --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: npm is not available.
    pause
    exit /b 1
)

echo.
echo Checking server dependencies...
if not exist "%SERVER_DIR%\node_modules" (
    echo Installing server dependencies...
    pushd "%SERVER_DIR%"
    call npm install
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
    call npm install
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

start "Birthday Backend" /d "%SERVER_DIR%" cmd /c "npm run dev"
timeout /t 4 /nobreak >nul

start "Birthday Frontend" /d "%CLIENT_DIR%" cmd /c "npm run dev"
timeout /t 6 /nobreak >nul

start http://localhost:5173

echo.
echo Servers are starting in separate windows.
echo Close this window or press any key to exit.
pause >nul
