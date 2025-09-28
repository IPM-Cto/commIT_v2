@echo off
echo ======================================
echo    Avvio applicazione commIT
echo ======================================

REM Verifica prerequisiti
echo Controllo prerequisiti...

where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRORE] Node.js non trovato. Installa Node.js prima di continuare.
    pause
    exit /b 1
)

where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRORE] npm non trovato. Installa npm prima di continuare.
    pause
    exit /b 1
)

where python >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo [ERRORE] Python non trovato. Installa Python 3 prima di continuare.
    pause
    exit /b 1
)

echo [OK] Prerequisiti verificati

REM Installa dipendenze backend
echo.
echo Installazione dipendenze backend...
cd backend

if not exist "venv" (
    echo Creazione ambiente virtuale Python...
    python -m venv venv
)

REM Attiva ambiente virtuale
call venv\Scripts\activate.bat

REM Installa pacchetti Python
pip install -r requirements.txt
echo [OK] Dipendenze backend installate

REM Installa dipendenze frontend
echo.
echo Installazione dipendenze frontend...
cd ..\frontend
call npm install
echo [OK] Dipendenze frontend installate

REM Controlla file .env
echo.
echo Controllo configurazione...

if not exist "..\backend\.env" (
    echo [ATTENZIONE] File backend\.env non trovato. Crealo da .env.example
    echo Copio .env.example in .env...
    copy ..\backend\.env.example ..\backend\.env >nul 2>nul
)

if not exist ".env" (
    echo [ATTENZIONE] File frontend\.env non trovato. Crealo da .env.example
    echo Copio .env.example in .env...
    copy .env.example .env >nul 2>nul
)

echo.
echo ======================================
echo    Avvio servizi
echo ======================================

REM Avvia backend in una nuova finestra
echo Avvio backend su http://localhost:8000...
cd ..\backend
start "commIT Backend" cmd /k "venv\Scripts\activate && python server.py"

REM Attendi che il backend sia pronto
timeout /t 5 /nobreak >nul

REM Avvia frontend in una nuova finestra
echo Avvio frontend su http://localhost:3000...
cd ..\frontend
start "commIT Frontend" cmd /k "npm start"

echo.
echo ======================================
echo    commIT avviato con successo!
echo ======================================
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:8000
echo API Docs: http://localhost:8000/docs
echo.
echo Chiudi le finestre dei terminali per arrestare i servizi
echo.
pause
