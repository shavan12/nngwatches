@echo off
echo Starting NNG Luxury Timepieces...
echo.

:: Start backend
echo [1/2] Starting backend server on port 4000...
start "NNG Backend" cmd /k "cd /d %~dp0backend && npm install && npm start"

:: Wait 3 seconds for backend to start
timeout /t 3 /nobreak > nul

:: Start frontend
echo [2/2] Starting frontend on port 5173...
start "NNG Frontend" cmd /k "cd /d %~dp0frontend && npm install && npm run dev"

:: Wait then open browser
timeout /t 5 /nobreak > nul
echo.
echo Opening browser...
start http://localhost:5173
echo.
echo Store:  http://localhost:5173
echo Admin:  http://localhost:5173/admin
echo.
echo Login:  admin@nng.com / admin123
pause
