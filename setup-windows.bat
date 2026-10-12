@echo off
setlocal
cd /d "%~dp0"

echo ========================================
echo   SmartService - First-time Setup
echo ========================================
echo.

where node >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js 20.19 or newer is required.
  echo Install the current Node.js LTS release, then run this file again.
  pause
  exit /b 1
)

node -e "const v=process.versions.node.split('.').map(Number);process.exit(v[0]<20||(v[0]===20&&v[1]<19)?1:0)"
if errorlevel 1 (
  echo ERROR: Node.js 20.19 or newer is required for the web and mobile apps.
  echo Install the current Node.js LTS release, then run this file again.
  pause
  exit /b 1
)

where docker >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker Desktop is required for the local database and RabbitMQ.
  echo Install Docker Desktop, start it, then run this file again.
  pause
  exit /b 1
)

docker info >nul 2>&1
if errorlevel 1 (
  echo ERROR: Docker Desktop is installed but is not running.
  echo Start Docker Desktop, wait until it is ready, then run this file again.
  pause
  exit /b 1
)

echo [1/4] Creating local backend settings...
node scripts\setup-env.js
if errorlevel 1 goto failed

echo.
echo [2/4] Installing backend dependencies...
pushd backend
call npm.cmd install
if errorlevel 1 (
  popd
  goto failed
)
popd

echo.
echo [3/4] Installing web and mobile dependencies...
pushd frontend
call npm.cmd install
if errorlevel 1 (
  popd
  goto failed
)
popd
pushd mobile
call npm.cmd install
if errorlevel 1 (
  popd
  goto failed
)
popd

echo.
echo [4/4] Starting the system...
call start.bat
exit /b %errorlevel%

:failed
echo.
echo Setup failed. Read the error above, resolve it, and run setup-windows.bat again.
pause
exit /b 1
