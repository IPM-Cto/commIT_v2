#!/bin/bash

# Start script per commIT
echo "======================================"
echo "   Avvio applicazione commIT"
echo "======================================"

# Verifica prerequisiti
echo "Controllo prerequisiti..."

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js non trovato. Installa Node.js prima di continuare."
    exit 1
fi

# Check npm
if ! command -v npm &> /dev/null; then
    echo "❌ npm non trovato. Installa npm prima di continuare."
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 non trovato. Installa Python 3 prima di continuare."
    exit 1
fi

# Check MongoDB
if ! command -v mongod &> /dev/null; then
    echo "⚠️  MongoDB non trovato localmente. Assicurati che MongoDB sia in esecuzione."
fi

echo "✅ Prerequisiti verificati"

# Installa dipendenze backend
echo ""
echo "Installazione dipendenze backend..."
cd backend
if [ ! -d "venv" ]; then
    echo "Creazione ambiente virtuale Python..."
    python3 -m venv venv
fi

# Attiva ambiente virtuale
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null

# Installa pacchetti Python
pip install -r requirements.txt

echo "✅ Dipendenze backend installate"

# Installa dipendenze frontend
echo ""
echo "Installazione dipendenze frontend..."
cd ../frontend
npm install
echo "✅ Dipendenze frontend installate"

# Crea file .env se non esistono
echo ""
echo "Controllo configurazione..."

if [ ! -f "../backend/.env" ]; then
    echo "⚠️  File backend/.env non trovato. Crealo da .env.example"
fi

if [ ! -f ".env" ]; then
    echo "⚠️  File frontend/.env non trovato. Crealo da .env.example"
fi

# Avvia i servizi
echo ""
echo "======================================"
echo "   Avvio servizi"
echo "======================================"

# Avvia MongoDB se non in esecuzione
if ! pgrep -x "mongod" > /dev/null; then
    echo "Avvio MongoDB..."
    mongod --dbpath ./data &
fi

# Avvia backend
echo "Avvio backend su http://localhost:8000..."
cd ../backend
source venv/bin/activate 2>/dev/null || . venv/Scripts/activate 2>/dev/null
python server.py &
BACKEND_PID=$!

# Attendi che il backend sia pronto
sleep 5

# Avvia frontend
echo "Avvio frontend su http://localhost:3000..."
cd ../frontend
npm start &
FRONTEND_PID=$!

echo ""
echo "======================================"
echo "   commIT avviato con successo!"
echo "======================================"
echo ""
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:8000"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "Premi Ctrl+C per arrestare tutti i servizi"

# Wait for Ctrl+C
trap 'kill $BACKEND_PID $FRONTEND_PID; exit' INT
wait
