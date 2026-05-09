@echo off
echo Starting AquaSense AI...
echo.
echo [1/2] Starting Backend (FastAPI on port 8000)...
start "AquaSense Backend" cmd /k "cd backend && pip install -r requirements.txt -q && uvicorn main:app --reload --port 8000"
timeout /t 3 /nobreak >nul
echo [2/2] Starting Frontend (Vite on port 5173)...
start "AquaSense Frontend" cmd /k "cd frontend && npm run dev"
echo.
echo Dashboard: http://localhost:5173
echo API:       http://localhost:8000/api/state
pause
