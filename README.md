# 🚀 commIT - Piattaforma Intelligente per Prenotazioni Locali

<div align="center">
  <img src="https://img.shields.io/badge/React-18.2-blue?style=flat-square&logo=react" />
  <img src="https://img.shields.io/badge/FastAPI-0.109-green?style=flat-square&logo=fastapi" />
  <img src="https://img.shields.io/badge/MongoDB-7.0-green?style=flat-square&logo=mongodb" />
  <img src="https://img.shields.io/badge/Auth0-2.2-orange?style=flat-square&logo=auth0" />
  <img src="https://img.shields.io/badge/OpenAI-GPT4-purple?style=flat-square&logo=openai" />
</div>

## 📋 Descrizione

**commIT** è una piattaforma innovativa che utilizza l'intelligenza artificiale per connettere utenti e provider di servizi locali. Ristoranti, parrucchieri, medici e molto altro - tutto prenotabile con un click attraverso un assistente AI intelligente.

## ✨ Caratteristiche Principali

- 🤖 **Assistente AI Intelligente**: Chat bot basato su OpenAI che comprende le esigenze degli utenti
- 📅 **Prenotazioni Smart**: Sistema di prenotazione automatizzato e intuitivo
- 👥 **Dual Interface**: Dashboard separate per clienti e provider
- 🔐 **Autenticazione Sicura**: Integrazione con Auth0 per login sicuro
- 📊 **Analytics Dashboard**: Statistiche dettagliate per i provider
- 🌍 **Geolocalizzazione**: Ricerca servizi basata sulla posizione
- 📱 **Mobile Responsive**: Ottimizzato per tutti i dispositivi

## 🏗️ Architettura

```
commIT/
├── backend/              # API FastAPI
│   ├── server.py        # Server principale
│   ├── database.py      # Connessione MongoDB
│   ├── database_schema.py # Schemi Pydantic
│   └── ai_agent.py      # Logica AI
├── frontend/            # React App
│   ├── src/
│   │   ├── pages/      # Pagine principali
│   │   ├── components/ # Componenti riutilizzabili
│   │   └── contexts/   # Context providers
│   └── public/
└── docker-compose.yml   # Orchestrazione servizi
```

## 🚀 Quick Start

### Prerequisiti

- Docker Desktop installato e in esecuzione
- Node.js 18+ (per sviluppo locale)
- Python 3.11+ (per sviluppo locale)
- Account Auth0 (gratuito)
- API Key OpenAI

### 1. Clona il Repository

```bash
git clone https://github.com/yourusername/commIT_v2.git
cd commIT_v2
```

### 2. Configura le Variabili d'Ambiente

**Backend (.env)**
```bash
cd backend
cp .env.example .env
# Modifica .env con le tue chiavi
```

**Frontend (.env)**
```bash
cd ../frontend
cp .env.example .env
# Modifica .env con le tue chiavi
```

### 3. Avvia l'Applicazione

#### 🐳 Con Docker (Raccomandato)

**Windows:**
```bash
start.bat
# Scegli opzione 1
```

**Linux/Mac:**
```bash
chmod +x start.sh
./start.sh
# Scegli opzione 1
```

#### 💻 Sviluppo Locale

**Windows:**
```bash
start.bat
# Scegli opzione 2
```

**Linux/Mac:**
```bash
./start.sh
# Scegli opzione 2
```

### 4. Accedi all'Applicazione

- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

## 🔧 Configurazione Auth0

1. Crea un account su [Auth0](https://auth0.com)
2. Crea una nuova applicazione (Single Page Application)
3. Configura gli URL:
   - Allowed Callback URLs: `http://localhost:3000/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
4. Copia Domain e Client ID nel file `.env`

## 🤖 Configurazione OpenAI

1. Crea un account su [OpenAI](https://platform.openai.com)
2. Genera una API Key
3. Aggiungi la chiave in `backend/.env` come `OPENAI_API_KEY`

## 📊 Database MongoDB

Il database viene creato automaticamente al primo avvio con dati di esempio.

### Collezioni Principali:
- **users**: Utenti registrati
- **providers**: Provider di servizi
- **bookings**: Prenotazioni
- **chat_sessions**: Sessioni chat
- **chat_messages**: Messaggi chat
- **reviews**: Recensioni
- **notifications**: Notifiche

## 🛠️ Sviluppo

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Linux/Mac
# oppure
venv\Scripts\activate  # Windows
pip install -r requirements.txt
python server.py
```

### Frontend

```bash
cd frontend
npm install
npm start
```

### Testing

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

## 📱 Funzionalità Dettagliate

### Per i Clienti
- 🔍 Ricerca intelligente di servizi
- 💬 Chat AI per assistenza personalizzata
- 📅 Gestione prenotazioni
- ⭐ Sistema recensioni
- 🔔 Notifiche in tempo reale
- ❤️ Salva provider preferiti

### Per i Provider
- 📊 Dashboard analytics
- 📅 Gestione calendario e disponibilità
- 👥 Gestione clienti
- 💰 Tracking pagamenti
- 📈 Statistiche performance
- 🔧 Configurazione servizi e prezzi

## 🐛 Troubleshooting

### Errore Docker
```bash
# Verifica che Docker sia in esecuzione
docker info

# Reset completo
docker-compose down -v
docker-compose up --build
```

### Errore MongoDB
```bash
# Verifica connessione
mongosh mongodb://localhost:27017

# Reset database
docker-compose down -v
```

### Errore Auth0
- Verifica che Domain e Client ID siano corretti
- Controlla che gli URL di callback siano configurati

### Errore OpenAI
- Verifica che l'API key sia valida
- Controlla i crediti disponibili

## 📝 API Endpoints

### Autenticazione
- `POST /api/auth/register` - Registrazione utente
- `GET /api/auth/me` - Dati utente corrente
- `POST /api/auth/logout` - Logout

### Provider
- `GET /api/providers` - Lista provider
- `GET /api/providers/{id}` - Dettaglio provider
- `PUT /api/providers/{id}` - Aggiorna provider

### Prenotazioni
- `POST /api/bookings` - Crea prenotazione
- `GET /api/bookings` - Lista prenotazioni
- `PUT /api/bookings/{id}/status` - Aggiorna stato

### Chat AI
- `POST /api/chat/start` - Avvia sessione
- `POST /api/chat/message` - Invia messaggio
- `GET /api/chat/history/{session_id}` - Storico chat

## 🔒 Sicurezza

- ✅ Autenticazione JWT con Auth0
- ✅ HTTPS in produzione
- ✅ Rate limiting su API
- ✅ Validazione input con Pydantic
- ✅ Sanitizzazione dati
- ✅ CORS configurato
- ✅ Secrets management

## 🚀 Deploy in Produzione

### Con Docker

1. Configura variabili d'ambiente di produzione
2. Modifica `docker-compose.prod.yml`
3. Esegui:
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Su Cloud (AWS/GCP/Azure)

1. Build delle immagini Docker
2. Push su registry
3. Deploy con Kubernetes o ECS
4. Configura load balancer e SSL

## 👥 Contribuire

1. Fork il progetto
2. Crea un branch (`git checkout -b feature/AmazingFeature`)
3. Commit le modifiche (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Questo progetto è distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 🆘 Supporto

- 📧 Email: support@commit.it
- 💬 Discord: [Join our server](https://discord.gg/commit)
- 📖 Docs: [Documentation](https://docs.commit.it)

## 🙏 Ringraziamenti

- React Team
- FastAPI Team
- MongoDB Team
- Auth0
- OpenAI
- Tutti i contributor

---

<div align="center">
  Made with ❤️ by the commIT Team
  <br />
  <a href="https://commit.it">www.commit.it</a>
</div>
