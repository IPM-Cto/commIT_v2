# 🚀 commIT - Piattaforma AI per Prenotazioni e Servizi Locali

## 📋 Panoramica
commIT è una piattaforma web/mobile innovativa che utilizza un agente AI per connettere utenti con provider di servizi locali (ristoranti, parrucchieri, medici, negozi, ecc.). L'applicazione offre un'esperienza di prenotazione intelligente e personalizzata.

## 🌟 Caratteristiche Principali

### Per Utenti (Customers)
- 🤖 **Chat AI Intelligente**: Assistente virtuale che comprende le richieste in linguaggio naturale
- 📅 **Prenotazioni Facili**: Prenota qualsiasi servizio con pochi click
- 🔍 **Ricerca Avanzata**: Trova servizi per categoria, posizione, valutazione
- ⭐ **Recensioni e Rating**: Sistema di valutazione per ogni provider
- 📱 **Dashboard Personalizzata**: Gestisci tutte le tue prenotazioni in un unico posto
- 🔔 **Notifiche Real-time**: Aggiornamenti istantanei sulle tue prenotazioni

### Per Provider di Servizi
- 📊 **Dashboard Professionale**: Analisi dettagliate della tua attività
- 📅 **Gestione Prenotazioni**: Accetta, rifiuta o modifica prenotazioni
- 👥 **Gestione Clienti**: Database completo dei tuoi clienti
- 📈 **Statistiche e Report**: Monitora le performance del tuo business
- 💬 **Comunicazione Diretta**: Chat integrata con i clienti
- 🎯 **Marketing Tools**: Promozioni e offerte speciali

## 🛠️ Stack Tecnologico

### Backend
- **Framework**: FastAPI (Python 3.9+)
- **Database**: MongoDB
- **Autenticazione**: Auth0 + JWT
- **AI/ML**: OpenAI GPT-4
- **Cache**: Redis (opzionale)

### Frontend
- **Framework**: React 18
- **UI Library**: Material-UI v5
- **State Management**: Context API + React Query
- **Routing**: React Router v6
- **Animazioni**: Framer Motion

## 📦 Installazione

### Prerequisiti
- Node.js 16+ e npm/yarn
- Python 3.9+
- MongoDB 5.0+
- Account Auth0
- API Key OpenAI

### Setup Rapido

#### 1. Clona il repository
```bash
git clone https://github.com/yourusername/commit.git
cd app_commIT
```

#### 2. Configura il Backend

```bash
cd backend

# Crea ambiente virtuale
python -m venv venv

# Attiva ambiente virtuale
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate

# Installa dipendenze
pip install -r requirements.txt

# Copia e configura .env
cp .env.example .env
# Modifica .env con le tue credenziali
```

#### 3. Configura il Frontend

```bash
cd frontend

# Installa dipendenze
npm install

# Copia e configura .env
cp .env.example .env
# Modifica .env con le tue credenziali
```

#### 4. Configura Auth0

1. Crea un account su [Auth0](https://auth0.com)
2. Crea una nuova applicazione (Single Page Application)
3. Configura:
   - Allowed Callback URLs: `http://localhost:3000/callback`
   - Allowed Logout URLs: `http://localhost:3000`
   - Allowed Web Origins: `http://localhost:3000`
4. Copia Domain e Client ID nel file `.env`

#### 5. Configura OpenAI

1. Ottieni API key da [OpenAI](https://platform.openai.com)
2. Aggiungi la key in `backend/.env`:
   ```
   OPENAI_API_KEY=sk-...
   ```

## 🚀 Avvio dell'Applicazione

### Metodo Automatico

#### Windows
```bash
start.bat
```

#### Linux/Mac
```bash
chmod +x start.sh
./start.sh
```

### Metodo Manuale

#### Backend
```bash
cd backend
source venv/bin/activate  # o venv\Scripts\activate su Windows
python server.py
```

#### Frontend
```bash
cd frontend
npm start
```

## 📱 Utilizzo

### Prima Esecuzione

1. **Accedi** a http://localhost:3000
2. **Registrati** come Cliente o Provider
3. **Completa il profilo** con i tuoi dati
4. **Esplora** i servizi disponibili o gestisci la tua attività

### Test Chat AI

1. Clicca sull'icona chat in basso a destra
2. Prova questi comandi:
   - "Cerco un ristorante italiano per stasera"
   - "Voglio prenotare un parrucchiere domani alle 15"
   - "Mostrami i medici disponibili questa settimana"

## 🗄️ Struttura Database

### Collections MongoDB

#### Users
- Informazioni base utenti
- Tipo: customer/provider/admin
- Dati autenticazione Auth0

#### Providers
- Dettagli attività commerciali
- Orari, servizi, prezzi
- Posizione e contatti

#### Bookings
- Prenotazioni attive/passate
- Stati: pending/confirmed/cancelled/completed
- Note e richieste speciali

#### Chat Sessions & Messages
- Storico conversazioni AI
- Context e intent analysis
- Suggerimenti e raccomandazioni

## 🔒 Sicurezza

- ✅ Autenticazione OAuth 2.0 con Auth0
- ✅ JWT tokens per API calls
- ✅ Rate limiting su endpoints critici
- ✅ Validazione input con Pydantic
- ✅ CORS configurato correttamente
- ✅ Secrets in variabili d'ambiente

## 📊 API Documentation

### Endpoints Principali

#### Autenticazione
- `POST /api/auth/register` - Completa registrazione
- `GET /api/auth/me` - Dati utente corrente
- `POST /api/auth/logout` - Logout

#### Provider
- `GET /api/providers` - Lista provider
- `GET /api/providers/{id}` - Dettagli provider
- `GET /api/providers/search` - Ricerca

#### Prenotazioni
- `POST /api/bookings` - Crea prenotazione
- `GET /api/bookings` - Le mie prenotazioni
- `PUT /api/bookings/{id}/status` - Aggiorna stato

#### Chat AI
- `POST /api/chat/start` - Inizia sessione
- `POST /api/chat/message` - Invia messaggio
- `GET /api/chat/history/{session_id}` - Storico chat

### Documentazione Interattiva
Disponibile su http://localhost:8000/docs (Swagger UI)

## 🧪 Testing

### Backend Tests
```bash
cd backend
pytest tests/ -v
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 🚢 Deployment

### Docker
```bash
docker-compose up -d
```

### Heroku
```bash
heroku create commit-app
heroku config:set $(cat .env)
git push heroku main
```

### Vercel (Frontend)
```bash
cd frontend
vercel --prod
```

## 🐛 Troubleshooting

### Problemi Comuni

#### MongoDB non si connette
- Verifica che MongoDB sia in esecuzione
- Controlla `MONGO_URL` in `.env`
- Prova: `mongod --dbpath ./data`

#### Auth0 login fallisce
- Verifica Domain e Client ID
- Controlla Allowed Callbacks in Auth0 dashboard
- Pulisci cache del browser

#### Chat AI non risponde
- Verifica OPENAI_API_KEY
- Controlla crediti OpenAI disponibili
- Vedi logs: `tail -f backend/commit.log`

## 📝 Roadmap

- [ ] App mobile (React Native)
- [ ] Pagamenti integrati (Stripe)
- [ ] Sistema di notifiche push
- [ ] Multi-lingua (EN, ES, FR, DE)
- [ ] Analytics avanzate per provider
- [ ] Integrazione calendario (Google, Outlook)
- [ ] QR code per check-in
- [ ] Sistema di fidelizzazione

## 🤝 Contributing

1. Fork il progetto
2. Crea un branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push al branch (`git push origin feature/AmazingFeature`)
5. Apri una Pull Request

## 📄 Licenza

Distribuito sotto licenza MIT. Vedi `LICENSE` per maggiori informazioni.

## 👥 Team

- **Product Owner**: [Nome]
- **Tech Lead**: [Nome]
- **AI Engineer**: [Nome]
- **Frontend Dev**: [Nome]
- **Backend Dev**: [Nome]

## 📞 Supporto

- Email: support@commit.it
- Discord: [Link Discord]
- Documentation: [Link Docs]

## 🙏 Ringraziamenti

- OpenAI per l'API GPT
- Auth0 per l'autenticazione
- MongoDB per il database
- Tutti i contributors open source

---

**commIT** - *Prenota il tuo futuro, un click alla volta* 🚀
