@echo off
setlocal
echo ========================================
echo   SmartService System - Starting Up
echo ========================================
echo.

echo [1/5] Starting MySQL and RabbitMQ with Docker Compose...
docker compose -f "%~dp0docker-compose.yml" up -d --wait mysql rabbitmq
if errorlevel 1 (
  echo.
  echo ERROR: MySQL or RabbitMQ could not start.
  echo Start Docker Desktop and check that ports 3307 and 5672 are available.
  pause
  exit /b 1
)

echo [2/5] Starting Backend API (port 5000)...
start "SmartService Backend" cmd /k "cd /d ""%~dp0backend"" && npm.cmd start"

echo [3/5] Starting Outbox Publisher and Event Worker...
start "SmartService Outbox Publisher" cmd /k "cd /d ""%~dp0backend"" && npm.cmd run outbox-publisher"
start "SmartService Event Worker" cmd /k "cd /d ""%~dp0backend"" && npm.cmd run worker"

timeout /t 2 /nobreak >nul

echo [4/5] Starting Web Frontend (port 3000)...
start "SmartService Frontend" cmd /k "cd /d ""%~dp0frontend"" && npm.cmd run dev"

echo [5/5] Starting Mobile App (Expo)...
start "SmartService Mobile" cmd /k "cd /d ""%~dp0mobile"" && npm.cmd start -- --lan"

echo.
echo ========================================
echo   Backend:  http://localhost:5000
echo   Frontend: http://localhost:3000
echo   RabbitMQ: http://localhost:15672
echo   Mobile:   See the Expo QR code in its terminal window
echo ========================================
echo.
echo Web and mobile apps, API, publisher, worker, MySQL, and RabbitMQ are starting.
pause
