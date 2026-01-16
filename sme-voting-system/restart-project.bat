@echo off
REM =============================================================================
REM Quick Restart Script for SME Voting System (Windows)
REM =============================================================================
REM
REM This script automates the fresh start process when you restart Hardhat.
REM Deploys BOTH Voting and QuadraticVoting contracts.
REM 
REM Usage:
REM   1. Close all running terminals (Hardhat, backend, frontend)
REM   2. Double-click this file OR run: restart-project.bat
REM   3. Wait for all services to start
REM
REM =============================================================================

echo.
echo ========================================
echo   SME Voting System - Fresh Restart
echo   (Simple + Quadratic Voting)
echo ========================================
echo.

REM Step 1: Clean database
echo [1/6] Cleaning database...
cd /d "%~dp0backend"
call npm run fresh-start
if errorlevel 1 (
    echo ERROR: Failed to clean database
    pause
    exit /b 1
)
echo.

REM Step 2: Start Hardhat in a new window
echo [2/6] Starting Hardhat node...
cd /d "%~dp0smart-contracts"
start "Hardhat Node" cmd /k "npx hardhat node"
echo Waiting for Hardhat to start (15 seconds)...
timeout /t 15 /nobreak
echo.

REM Step 3: Deploy BOTH contracts
echo [3/6] Deploying contracts (Voting + QuadraticVoting)...
npx hardhat run scripts/deploy.js --network localhost
if errorlevel 1 (
    echo ERROR: Failed to deploy contracts
    echo Make sure Hardhat node is running
    pause
    exit /b 1
)
echo.

REM Step 4: Start backend in a new window
echo [4/6] Starting backend server...
cd /d "%~dp0backend"
start "Backend Server" cmd /k "npm run dev"
echo Waiting for backend to start (5 seconds)...
timeout /t 5 /nobreak
echo.

REM Step 5: Start frontend in a new window
echo [5/6] Starting frontend...
cd /d "%~dp0frontend"
start "Frontend" cmd /k "npm run dev"
echo.

REM Step 6: Done
echo [6/6] All services started!
echo.
echo ========================================
echo   Services Running:
echo ========================================
echo   - Hardhat Node:    http://127.0.0.1:8545
echo   - Backend Server:  http://localhost:3001
echo   - Frontend:        http://localhost:5173
echo ========================================
echo.
echo   Contracts Deployed:
echo   - Voting (Simple)       [Check console output above]
echo   - QuadraticVoting       [Check console output above]
echo ========================================
echo.
echo IMPORTANT: Copy the contract addresses from the deployment
echo output above and add them to backend/.env file:
echo   CONTRACT_ADDRESS=...
echo   QUADRATIC_CONTRACT_ADDRESS=...
echo.
echo Open your browser to: http://localhost:5173
echo.
echo Press any key to close this window...
pause > nul
