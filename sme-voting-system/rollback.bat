@echo off
REM =============================================================================
REM Rollback Script for SME Voting System (Windows)
REM =============================================================================
REM
REM This script provides quick rollback options for different layers.
REM Use this when you need to revert changes after a failed deployment.
REM
REM Usage: rollback.bat [option]
REM   Options:
REM     db       - Rollback database (fresh-start)
REM     contracts - Redeploy contracts
REM     full     - Full rollback (db + contracts)
REM
REM =============================================================================

echo.
echo ========================================
echo   SME Voting System - Rollback Script
echo ========================================
echo.

if "%1"=="" goto menu
if "%1"=="db" goto rollback_db
if "%1"=="contracts" goto rollback_contracts
if "%1"=="full" goto rollback_full
goto menu

:menu
echo Select rollback option:
echo.
echo   [1] Database only (fresh-start)
echo   [2] Smart Contracts only (redeploy)
echo   [3] Full rollback (database + contracts)
echo   [4] Cancel
echo.
set /p choice="Enter choice (1-4): "

if "%choice%"=="1" goto rollback_db
if "%choice%"=="2" goto rollback_contracts
if "%choice%"=="3" goto rollback_full
if "%choice%"=="4" goto cancel
goto menu

:rollback_db
echo.
echo ========================================
echo   Rolling back DATABASE...
echo ========================================
echo.
echo WARNING: This will delete all proposals and votes!
echo.
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" goto cancel

cd /d "%~dp0backend"
call npm run fresh-start
if errorlevel 1 (
    echo ERROR: Database rollback failed
    pause
    exit /b 1
)
echo.
echo ✅ Database rolled back successfully
goto done

:rollback_contracts
echo.
echo ========================================
echo   Redeploying SMART CONTRACTS...
echo ========================================
echo.
echo NOTE: Make sure Hardhat node is running!
echo.

cd /d "%~dp0smart-contracts"
npx hardhat run scripts/deploy.js --network localhost
if errorlevel 1 (
    echo ERROR: Contract deployment failed
    echo Make sure Hardhat node is running
    pause
    exit /b 1
)
echo.
echo ✅ Contracts redeployed successfully
echo.
echo IMPORTANT: Update backend/.env with new contract addresses!
goto done

:rollback_full
echo.
echo ========================================
echo   FULL ROLLBACK (Database + Contracts)
echo ========================================
echo.
echo WARNING: This will:
echo   - Delete all proposals and votes from database
echo   - Redeploy smart contracts (new addresses)
echo.
set /p confirm="Are you sure? (y/n): "
if /i not "%confirm%"=="y" goto cancel

echo.
echo [1/2] Rolling back database...
cd /d "%~dp0backend"
call npm run fresh-start
if errorlevel 1 (
    echo ERROR: Database rollback failed
    pause
    exit /b 1
)

echo.
echo [2/2] Redeploying contracts...
cd /d "%~dp0smart-contracts"
npx hardhat run scripts/deploy.js --network localhost
if errorlevel 1 (
    echo ERROR: Contract deployment failed
    pause
    exit /b 1
)

echo.
echo ========================================
echo   ✅ Full Rollback Complete!
echo ========================================
echo.
echo IMPORTANT: Update backend/.env with new contract addresses!
echo.
goto done

:cancel
echo.
echo Rollback cancelled.
goto done

:done
echo.
pause
