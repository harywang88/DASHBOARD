@echo off
REM Setup script untuk GPS Tracking System (Windows)

echo.
echo 🚀 GPS Tracking System - Setup Script (Windows)
echo =============================================
echo.

REM Check if Node.js installed
echo Checking Node.js...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo ❌ Node.js not found. Please install Node.js first.
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node -v') do set NODE_VERSION=%%i
echo ✓ Node.js %NODE_VERSION% found
echo.

REM Check if MongoDB installed
echo Checking MongoDB...
where mongod >nul 2>nul
if %errorlevel% neq 0 (
    echo ⚠️  MongoDB not found locally. Using MongoDB Atlas (cloud) instead.
    echo    Update .env file dengan connection string dari MongoDB Atlas
) else (
    echo ✓ MongoDB found
)
echo.

REM Setup Backend
echo Setting up Backend...
cd gps-backend
call npm install
echo ✓ Backend dependencies installed
cd ..
echo.

REM Setup Dashboard
echo Setting up Dashboard...
cd gps-dashboard
call npm install
echo ✓ Dashboard dependencies installed
cd ..
echo.

REM Create .env file if not exists
if not exist gps-backend\.env (
    echo Creating .env file...
    (
        echo MONGODB_URI=mongodb://localhost:27017/gps-tracker
        echo PORT=5000
        echo NODE_ENV=development
    ) > gps-backend\.env
    echo ✓ .env file created
    echo.
)

echo ✅ Setup complete!
echo.
echo Next steps:
echo 1. Start Backend: cd gps-backend ^&^& npm start
echo 2. Start Dashboard: cd gps-dashboard ^&^& npm start
echo 3. Setup Android App in Android Studio
echo 4. Open dashboard at http://localhost:3000
echo.
pause
