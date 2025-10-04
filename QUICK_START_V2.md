# 🚀 Quick Start - Sistema Auth v2.0

## ⚡ Avvio Rapido (5 minuti)

### 1. Backend

```bash
cd backend

# Attiva ambiente virtuale
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Avvia nuovo server
python server_v2.py
```

**Output atteso:**
```
🚀 Avvio CommIT Server v2.0...
✅ Database connesso
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### 2. Frontend

```bash
cd frontend

# Aggiorna .env
echo "REACT_APP_API_URL=http://localhost:8000/api/v2" >> .env

# Avvia frontend
npm start
```

**Browser si apre automaticamente su:** `http://localhost:3000`

### 3. Test Rapido

1. **Registrazione**:
   - Vai a http://localhost:3000/register
   - Seleziona "Cliente"
   - Email: test@example.com
   - Password: TestPass123
   - Nome: Test User
   - Clicca "Conferma"
   
2. **Verifica**:
   - Dovresti vedere dashboard customer
   - Controlla localStorage: deve contenere `access_token`

3. **Logout & Login**:
   - Fai logout
   - Vai a http://localhost:3000/login
   - Inserisci stesse credenziali
   - Login successful!

---

## 📁 Struttura File Nuovi

```
backend/
├── auth_service.py          ← ✅ NUOVO - Servizio auth
├── auth_models.py           ← ✅ NUOVO - Modelli Pydantic
└── server_v2.py             ← ✅ NUOVO - Server ristrutturato

frontend/src/
├── services/
│   └── AuthService.js       ← ✅ NUOVO - Servizio auth client
├── contexts/
│   └── AuthContext.js       ← ✅ NUOVO - Context semplificato
├── pages/
│   ├── LoginV2.js           ← ✅ NUOVO - Login UI
│   └── RegisterV2.js        ← ✅ NUOVO - Register UI
├── components/
│   └── PrivateRouteV2.js    ← ✅ NUOVO - Route protection
└── AppV2.js                 ← ✅ NUOVO - App ristrutturata
```

---

## 🔄 Differenze Chiave

### Prima (v1 - Auth0)

```javascript
// Login
const { loginWithRedirect } = useAuth0();
await loginWithRedirect();

// Get user
const { user } = useAuth0();

// Problemi:
// - Dipendenza Auth0
// - Redirect esterni
// - Configurazione complessa
```

### Ora (v2 - JWT)

```javascript
// Login
const { login } = useAuth();
const result = await login(email, password);

// Get user
const { user } = useAuth();

// Vantaggi:
// - Controllo totale
// - Nessun redirect
// - Setup semplice
```

---

## 🎯 Endpoint Principali

### Backend API (v2)

```
POST   /api/v2/auth/register        # Registra utente
POST   /api/v2/auth/login           # Login
POST   /api/v2/auth/refresh         # Refresh token
GET    /api/v2/auth/me              # Dati utente
PUT    /api/v2/auth/profile         # Aggiorna profilo
POST   /api/v2/auth/change-password # Cambia password
GET    /api/v2/providers            # Lista provider
GET    /api/v2/bookings             # Lista prenotazioni
```

### Documentazione API

http://localhost:8000/docs

---

## 🧪 Test Veloci

### Test 1: Registrazione (API)

```bash
curl -X POST http://localhost:8000/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario@example.com",
    "password": "MarioPass123",
    "full_name": "Mario Rossi",
    "user_type": "customer",
    "phone": "+393331234567"
  }'
```

**Output atteso:**
```json
{
  "success": true,
  "message": "Registrazione completata con successo",
  "user": {
    "_id": "...",
    "email": "mario@example.com",
    "full_name": "Mario Rossi",
    "user_type": "customer"
  },
  "tokens": {
    "access_token": "eyJ...",
    "refresh_token": "eyJ...",
    "token_type": "bearer"
  }
}
```

### Test 2: Login (API)

```bash
curl -X POST http://localhost:8000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "mario@example.com",
    "password": "MarioPass123"
  }'
```

### Test 3: Get Current User

```bash
# Usa il token dal login/register
TOKEN="eyJ..."

curl -X GET http://localhost:8000/api/v2/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

---

## 🐛 Troubleshooting

### Problema: Backend non parte

**Errore:**
```
❌ Errore connessione database
```

**Soluzione:**
```bash
# Verifica MongoDB in esecuzione
# Windows:
net start MongoDB

# Linux:
sudo systemctl start mongod

# Mac:
brew services start mongodb-community
```

### Problema: Frontend non trova API

**Errore:**
```
Network Error
```

**Soluzione:**
```bash
# Verifica .env
cat frontend/.env
# Deve contenere:
REACT_APP_API_URL=http://localhost:8000/api/v2

# Riavvia frontend
npm start
```

### Problema: Token expired

**Errore:**
```
401 Unauthorized - Token expired
```

**Soluzione:**
```javascript
// Il refresh dovrebbe essere automatico
// Se non funziona, pulisci localStorage:
localStorage.clear();
// Poi fai login di nuovo
```

### Problema: Password validation fails

**Errore:**
```
Password deve contenere almeno una maiuscola
```

**Soluzione:**
```
Password valide:
✅ TestPass123
✅ SecurePass456
✅ MyPassword789

Password NON valide:
❌ test123 (no maiuscola)
❌ TESTPASS (no minuscola)
❌ TestPass (no numero)
❌ Test12 (< 8 caratteri)
```

---

## 📊 Checklist Completa

### Setup Iniziale
- [ ] MongoDB installato e in esecuzione
- [ ] Python 3.9+ installato
- [ ] Node.js 16+ installato
- [ ] Virtual environment creato
- [ ] Dipendenze backend installate
- [ ] Dipendenze frontend installate

### Backend v2
- [ ] `auth_service.py` creato
- [ ] `auth_models.py` creato
- [ ] `server_v2.py` creato
- [ ] Server avviato su porta 8000
- [ ] Health check OK: http://localhost:8000/health
- [ ] Docs accessibili: http://localhost:8000/docs

### Frontend v2
- [ ] `AuthService.js` creato in `src/services/`
- [ ] `AuthContext.js` creato in `src/contexts/`
- [ ] `LoginV2.js` creato in `src/pages/`
- [ ] `RegisterV2.js` creato in `src/pages/`
- [ ] `PrivateRouteV2.js` creato in `src/components/`
- [ ] `AppV2.js` creato in `src/`
- [ ] `.env` aggiornato con REACT_APP_API_URL
- [ ] Frontend avviato su porta 3000

### Test Funzionali
- [ ] Registrazione customer funziona
- [ ] Registrazione provider funziona
- [ ] Login funziona
- [ ] Logout funziona
- [ ] Dashboard customer carica
- [ ] Dashboard provider carica
- [ ] Refresh page mantiene login
- [ ] Token refresh automatico
- [ ] Password strength indicator funziona
- [ ] Form validation funziona

---

## 🎓 Concetti Chiave

### JWT Tokens

```
Access Token (short-lived):
- Durata: 30 minuti
- Uso: Ogni richiesta API
- Storage: localStorage
- Auto-refresh quando scade

Refresh Token (long-lived):
- Durata: 30 giorni
- Uso: Refresh access token
- Storage: localStorage
- Invalido dopo logout
```

### Password Security

```python
# Backend: Hash con bcrypt
hashed = bcrypt.hashpw(password, salt)

# Validation:
- Min 8 caratteri
- 1+ maiuscola
- 1+ minuscola
- 1+ numero

# Strength Score:
0-40:  Debole (rosso)
40-70: Media (arancione)
70+:   Forte (verde)
```

### State Management

```javascript
// localStorage (persistent)
- access_token
- refresh_token
- user_data

// React State (volatile)
- user (from AuthContext)
- loading
- error

// Sync:
Init → Load from localStorage
Login → Save to localStorage + setState
Logout → Clear localStorage + setState
```

---

## 🔗 Link Utili

### Documentazione
- **API Docs**: http://localhost:8000/docs
- **ReDoc**: http://localhost:8000/redoc
- **Health**: http://localhost:8000/health

### Frontend
- **Landing**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **Register**: http://localhost:3000/register
- **Dashboard**: http://localhost:3000/dashboard

### Repository
- **Documentazione Completa**: `RESTRUCTURE_V2_COMPLETE.md`
- **Fix Registration**: `FIX_REGISTRATION_COMPLETE.md`
- **Alternative Solutions**: `ALTERNATIVE_SOLUTIONS.md`

---

## 💡 Tips & Best Practices

### Development

```bash
# Backend: Auto-reload
RELOAD=True python server_v2.py

# Frontend: Auto-reload
npm start  # già configurato

# Logs backend
tail -f backend/commit.log

# Logs frontend
# Apri DevTools → Console
```

### Debugging

```javascript
// Frontend: Verifica stato auth
console.log(AuthService.getUserData());
console.log(AuthService.getAccessToken());

// Backend: Logs dettagliati
LOG_LEVEL=DEBUG python server_v2.py
```

### Production

```bash
# Backend
DEBUG=False
LOG_LEVEL=WARNING
JWT_SECRET_KEY=<strong-random-key>

# Frontend
REACT_APP_API_URL=https://api.yourdomain.com/api/v2
npm run build
```

---

## 🚦 Status Indicators

### Backend Health

```bash
curl http://localhost:8000/health
```

**Healthy:**
```json
{
  "status": "healthy",
  "database": "healthy",
  "timestamp": "2025-01-02T10:00:00"
}
```

**Unhealthy:**
```json
{
  "status": "unhealthy",
  "database": "not_connected",
  "timestamp": "2025-01-02T10:00:00"
}
```

### Frontend Auth

**Authenticated:**
```javascript
AuthService.isAuthenticated() === true
localStorage.getItem('access_token') !== null
```

**Not Authenticated:**
```javascript
AuthService.isAuthenticated() === false
localStorage.getItem('access_token') === null
```

---

## 📝 Notes

### Differenze v1 → v2

1. **No Auth0**: Sistema interno JWT
2. **No Auth0Provider**: Solo AuthProvider
3. **No loginWithRedirect**: Metodo login diretto
4. **Password storage**: Hash in database
5. **Tokens**: access + refresh tokens
6. **API paths**: `/api/v2/auth/*`

### Compatibilità

- ✅ Tutte le feature v1
- ✅ Database schema invariato
- ✅ Dashboard esistenti
- ✅ Provider/Booking logic
- ❌ Auth0 metadata (non più necessario)

---

## ⏭️ Next Steps

1. **Test completo** di tutti i flussi
2. **Migra utenti** esistenti (se presenti)
3. **Deploy backend** v2
4. **Deploy frontend** v2
5. **Monitor** logs per errori
6. **Backup** database regolarmente

---

## 🎉 Congratulazioni!

Hai completato la ristrutturazione del sistema di autenticazione!

**Cosa hai ottenuto:**
- ✅ Sistema auth moderno e robusto
- ✅ Controllo totale su auth
- ✅ Zero dipendenze esterne
- ✅ Migliore performance
- ✅ Costi ridotti
- ✅ Privacy migliorata

**Prossimo obiettivo:**
- Implementa email verification
- Aggiungi password reset
- Setup monitoring

---

**Versione:** 2.0.0  
**Ultima modifica:** Gennaio 2025  
**Status:** ✅ READY

**Buon lavoro! 🚀**
