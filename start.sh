#!/bin/bash

echo "========================================"
echo "   commIT - Avvio Applicazione"
echo "========================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}[ERRORE] Docker non è in esecuzione!${NC}"
    echo "Avvia Docker e riprova."
    exit 1
fi

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}[INFO] Creazione file .env per il backend...${NC}"
    cp backend/.env.example backend/.env
    echo -e "${YELLOW}[ATTENZIONE] Configura backend/.env con le tue chiavi API!${NC}"
fi

if [ ! -f "frontend/.env" ]; then
    echo -e "${YELLOW}[INFO] Creazione file .env per il frontend...${NC}"
    cp frontend/.env.example frontend/.env
    echo -e "${YELLOW}[ATTENZIONE] Configura frontend/.env con le tue chiavi API!${NC}"
fi

# Function to show menu
show_menu() {
    echo ""
    echo "[1] Avvio con Docker Compose (Raccomandato)"
    echo "[2] Avvio locale (Development)"
    echo "[3] Solo Backend"
    echo "[4] Solo Frontend"
    echo "[5] Reset Database"
    echo "[0] Esci"
    echo ""
    read -p "Scegli opzione: " choice
}

# Docker Compose startup
start_docker() {
    echo ""
    echo -e "${GREEN}[INFO] Avvio con Docker Compose...${NC}"
    docker-compose up --build
}

# Local development startup
start_local() {
    echo ""
    echo -e "${GREEN}[INFO] Avvio locale in modalità development...${NC}"
    
    # Start MongoDB
    echo -e "${GREEN}[INFO] Avvio MongoDB...${NC}"
    docker run -d -p 27017:27017 --name commit-mongodb mongo:7.0
    sleep 5
    
    # Start Backend
    echo -e "${GREEN}[INFO] Avvio Backend...${NC}"
    (cd backend && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt && python server.py) &
    sleep 5
    
    # Start Frontend
    echo -e "${GREEN}[INFO] Avvio Frontend...${NC}"
    (cd frontend && npm install && npm start) &
    
    echo ""
    echo -e "${GREEN}[SUCCESS] Applicazione avviata!${NC}"
    echo ""
    echo "Backend: http://localhost:8000"
    echo "Frontend: http://localhost:3000"
    echo "MongoDB: mongodb://localhost:27017"
    echo ""
    
    # Wait for user input to stop
    read -p "Premi ENTER per fermare l'applicazione..."
    
    # Stop services
    killall node
    killall python
    docker stop commit-mongodb
    docker rm commit-mongodb
}

# Start only backend
start_backend() {
    echo ""
    echo -e "${GREEN}[INFO] Avvio solo Backend...${NC}"
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python server.py
}

# Start only frontend
start_frontend() {
    echo ""
    echo -e "${GREEN}[INFO] Avvio solo Frontend...${NC}"
    cd frontend
    npm install
    npm start
}

# Reset database
reset_database() {
    echo ""
    echo -e "${RED}[ATTENZIONE] Questo cancellerà tutti i dati del database!${NC}"
    read -p "Sei sicuro? (s/n): " confirm
    if [[ $confirm == "s" ]] || [[ $confirm == "S" ]]; then
        docker-compose down -v
        echo -e "${GREEN}[INFO] Database resettato.${NC}"
    fi
}

# Main menu loop
while true; do
    show_menu
    case $choice in
        1)
            start_docker
            break
            ;;
        2)
            start_local
            break
            ;;
        3)
            start_backend
            break
            ;;
        4)
            start_frontend
            break
            ;;
        5)
            reset_database
            ;;
        0)
            echo "Arrivederci!"
            exit 0
            ;;
        *)
            echo -e "${RED}Opzione non valida!${NC}"
            ;;
    esac
done
