@echo off
echo ========================================
echo   commIT - Avvio Applicazione
echo ========================================
echo.

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRORE] Docker non è in esecuzione!
    echo Avvia Docker Desktop e riprova.
    pause
    exit /b 1
)

REM Check if .env files exist
if not exist "backend\.env" (
    echo [INFO] Creazione file .env per il backend...
    copy backend\.env.example backend\.env
    echo [ATTENZIONE] Configura backend\.env con le tue chiavi API!
)

if not exist "frontend\.env" (
    echo [INFO] Creazione file .env per il frontend...
    copy frontend\.env.example frontend\.env
    echo [ATTENZIONE] Configura frontend\.env con le tue chiavi API!
)

echo.
echo [1] Avvio con Docker Compose (Raccomandato)
echo [2] Avvio locale (Development)
echo [3] Solo Backend
echo [4] Solo Frontend
echo [5] Reset Database
echo [0] Esci
echo.
set /p choice="Scegli opzione: "

if "%choice%"=="1" goto docker
if "%choice%"=="2" goto local
if "%choice%"=="3" goto backend
if "%choice%"=="4" goto frontend
if "%choice%"=="5" goto reset
if "%choice%"=="0" goto exit

:docker
echo.
echo [INFO] Avvio con Docker Compose...
docker-compose up --build
goto end

:local
echo.
echo [INFO] Avvio locale in modalità development...
echo.
echo [INFO] Avvio MongoDB...
start cmd /k "docker run -p 27017:27017 --name commit-mongodb -d mongo:7.0"
timeout /t 5 /nobreak >nul

echo [INFO] Avvio Backend...
start cmd /k "cd backend && python -m venv venv && venv\Scripts\activate && pip install -r requirements.txt && python server.py"
timeout /t 5 /nobreak >nul

echo [INFO] Avvio Frontend...
start cmd /k "cd frontend && npm install && npm start"

echo.
echo [SUCCESS] Applicazione avviata!
echo.
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo MongoDB: mongodb://localhost:27017
echo.
goto end

:backend
echo.
echo [INFO] Avvio solo Backend...
cd backend
python -m venv venv
call venv\Scripts\activate
pip install -r requirements.txt
python server.py
goto end

:frontend
echo.
echo [INFO] Avvio solo Frontend...
cd frontend
npm install
npm start
goto end

:reset
echo.
echo [ATTENZIONE] Questo cancellerà tutti i dati del database!
set /p confirm="Sei sicuro? (s/n): "
if /i "%confirm%"=="s" (
    docker-compose down -v
    echo [INFO] Database resettato.
)
goto end

:exit
echo Arrivederci!
exit /b 0

:end
pause
