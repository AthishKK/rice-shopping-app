@echo off
echo 🚀 Starting MongoDB for Rice Shopping App...
echo.

REM Try to start MongoDB service
echo 📊 Attempting to start MongoDB service...
net start MongoDB 2>nul
if %errorlevel% == 0 (
    echo ✅ MongoDB service started successfully!
    goto :test_connection
)

echo ⚠️ MongoDB service not found or already running.
echo.

REM Try to start MongoDB manually
echo 📊 Looking for MongoDB installation...
if exist "C:\Program Files\MongoDB\Server\*\bin\mongod.exe" (
    echo ✅ Found MongoDB installation
    echo 🚀 Starting MongoDB manually...
    start "MongoDB" "C:\Program Files\MongoDB\Server\7.0\bin\mongod.exe" --dbpath "C:\data\db"
    timeout /t 3 >nul
    goto :test_connection
)

if exist "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" (
    echo ✅ Found MongoDB 6.0 installation
    echo 🚀 Starting MongoDB manually...
    start "MongoDB" "C:\Program Files\MongoDB\Server\6.0\bin\mongod.exe" --dbpath "C:\data\db"
    timeout /t 3 >nul
    goto :test_connection
)

if exist "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" (
    echo ✅ Found MongoDB 5.0 installation
    echo 🚀 Starting MongoDB manually...
    start "MongoDB" "C:\Program Files\MongoDB\Server\5.0\bin\mongod.exe" --dbpath "C:\data\db"
    timeout /t 3 >nul
    goto :test_connection
)

echo ❌ MongoDB not found!
echo.
echo 💡 Please install MongoDB:
echo    1. Download from: https://www.mongodb.com/try/download/community
echo    2. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas
echo    3. Or install via chocolatey: choco install mongodb
echo.
pause
exit /b 1

:test_connection
echo.
echo 🧪 Testing database connection...
node checkDatabaseHealth.js
if %errorlevel% == 0 (
    echo.
    echo ✅ MongoDB is ready!
    echo 🎉 You can now start your Rice Shopping App backend
    echo.
    echo 💡 To start the backend server, run:
    echo    npm start
) else (
    echo.
    echo ❌ Database connection failed
    echo 💡 Please check MongoDB installation and try again
)

echo.
pause