# 🧪 Test Rapidi - Fix Registrazione

## Test 1: Verifica Risposta API

### Backend Test
```bash
# Avvia backend
cd backend
python server.py

# In un altro terminale, testa l'endpoint
curl http://localhost:8000/api/test
```

**Output atteso:**
```json
{
  "message": "Test endpoint funzionante",
  "timestamp": "2025-01-XX..."
}
```

### Test /auth/me con Token Fittizio

```bash
# Crea un token di test
curl -X POST http://localhost:8000/api/auth/token \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "name": "Test User",
    "auth0_id": "test_user_123"
  }'
```

**Output atteso:**
```json
{
  "access_token": "eyJ...",
  "token_type": "bearer",
  "expires_in": 86400
}
```

Poi usa il token:
```bash
# Sostituisci YOUR_TOKEN con il token ricevuto
curl http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Output atteso per utente NON registrato:**
```json
{
  "success": false,
  "user": {
    "auth0_id": "test_user_123",
    "email": "test@example.com",
    "user_type": null,
    "registration_complete": false
  },
  "message": "User not found - registration incomplete"
}
```

## Test 2: Verifica Frontend

### Console Logs da Cercare

Dopo il login, nella console del browser dovresti vedere:

```
✅ LOGS CORRETTI:
🔄 UserContext: Initializing...
🔐 UserContext: User authenticated, fetching data...
📤 UserContext: Fetching user data from API...
✅ UserContext: Raw API response: { success: true, user: {...} }
✅ UserContext: Extracted user from response.data.user
✅ UserContext: Final user object: { user_type: "customer", ... }
✅ UserContext: User type extracted: customer
📊 UserContext State: { userType: "customer", isCustomer: true }

❌ LOGS DA NON VEDERE:
userType: undefined
userType: "undefined" (stringa)
Error: user_type not found
```

### Verifica localStorage

Apri DevTools → Console e digita:

```javascript
// 1. Verifica dati utente
const userData = JSON.parse(localStorage.getItem('user_data'));
console.log('User Data:', userData);
console.log('User Type:', userData?.user_type);

// 2. Verifica user_type diretto
const userType = localStorage.getItem('user_type');
console.log('Direct User Type:', userType);

// 3. Verifica tutto
console.log({
  userData: userData,
  userType: userType,
  hasUserType: !!userData?.user_type,
  value: userData?.user_type
});
```

**Output atteso:**
```javascript
{
  userData: {
    _id: "...",
    email: "user@example.com",
    user_type: "customer",  // ✅ Deve essere presente!
    full_name: "Test User"
  },
  userType: "customer",
  hasUserType: true,
  value: "customer"
}
```

## Test 3: Test Completo di Registrazione

### Passo 1: Pulisci Tutto
```javascript
// Console browser
localStorage.clear();
// Poi ricarica pagina
```

### Passo 2: Fai Login
- Vai su http://localhost:3000
- Clicca "Login"
- Completa login Auth0

### Passo 3: Verifica Redirect
Dovresti essere reindirizzato a `/register` perché non hai `user_type`

### Passo 4: Compila Form
- Seleziona tipo utente (Customer/Provider)
- Compila campi obbligatori
- Clicca Submit

### Passo 5: Verifica Backend Logs
Nel terminale backend dovresti vedere:
```
📥 Registrazione ricevuta: user_type=customer
🆔 Auth0 ID: test_user_123
💾 Salvataggio in collezione 'users'...
✅ Utente salvato con ID: 67a8f...
📤 Response finale: user_type=customer
```

### Passo 6: Verifica Frontend Logs
Nel browser console:
```
✅ UserContext: API data received: { success: true, user: {...} }
✅ UserContext: Extracted user from response.data.user
✅ UserContext: User type extracted: customer
📊 UserContext State: { userType: "customer", isCustomer: true }
```

### Passo 7: Verifica Dashboard
Dovresti essere automaticamente reindirizzato alla dashboard corretta:
- Customer → `/dashboard/customer`
- Provider → `/dashboard/provider`

## Test 4: Test Utente Esistente

### Passo 1: Logout e Rilogin
```javascript
// Logout
localStorage.clear();
// Login di nuovo con lo stesso utente
```

### Passo 2: Verifica NO redirect a /register
Dopo il login, dovresti andare DIRETTAMENTE alla dashboard, NON a `/register`

### Passo 3: Verifica Logs
```
✅ UserContext: Loaded from localStorage: { user_type: "customer" }
✅ UserContext: API data received: { success: true, user: {...} }
🎯 DashboardRouter: effectiveUserType = customer
✅ Loading CustomerDashboard
```

## Test 5: Test Errori

### Test Database Offline

1. **Ferma MongoDB**
   ```bash
   # Windows
   net stop MongoDB
   
   # Linux/Mac
   sudo systemctl stop mongod
   ```

2. **Fai Login**
   - Dovresti comunque vedere dati da Auth0
   - Console dovrebbe mostrare warning ma NON errori critici

3. **Verifica Fallback**
   ```
   ⚠️ UserContext: Database query failed
   ⚠️ UserContext: Using cached data as fallback
   ```

### Test Token Scaduto

1. **Modifica token in localStorage** (per simulare)
   ```javascript
   localStorage.setItem('auth_token', 'invalid_token_xxx');
   ```

2. **Ricarica pagina**
   - Dovresti essere reindirizzato a login
   - Console: "Token scaduto" o "Credenziali non valide"

## Test 6: Test Network Tab

### Verifica Struttura Risposta

1. Apri DevTools → Network
2. Fai login
3. Cerca richiesta a `/api/auth/me`
4. Clicca sulla richiesta → Preview

**Struttura attesa:**
```json
{
  "success": true,
  "user": {
    "_id": "...",
    "email": "user@example.com",
    "user_type": "customer",
    "full_name": "Test User",
    "is_active": true
  },
  "message": "User data retrieved successfully"
}
```

5. Verifica che `user_type` sia dentro `user`, NON al livello root

## Checklist Test Completa

### ✅ Prima del Deploy

- [ ] Backend `/api/test` funziona
- [ ] Backend `/api/auth/token` genera token
- [ ] Backend `/api/auth/me` ritorna struttura corretta
- [ ] Backend `/api/auth/register` salva user_type
- [ ] Frontend UserContext estrae user_type correttamente
- [ ] Frontend salva in localStorage
- [ ] Frontend legge da localStorage all'avvio
- [ ] Redirect a /register funziona per nuovi utenti
- [ ] Redirect a dashboard funziona per utenti esistenti
- [ ] Nessun errore nella console
- [ ] Nessun `user_type: undefined`

### ✅ Test Funzionali

- [ ] Nuova registrazione Customer funziona
- [ ] Nuova registrazione Provider funziona
- [ ] Login utente esistente funziona
- [ ] Refresh pagina mantiene stato
- [ ] Logout pulisce stato
- [ ] Cambio user_type (Customer→Provider) funziona

### ✅ Test Errori

- [ ] Database offline: fallback funziona
- [ ] Token scaduto: redirect a login
- [ ] Network error: mostra messaggio
- [ ] API errore 500: gestito gracefully

## 🐛 Problemi Comuni e Soluzioni

### Problema: user_type sempre undefined

**Soluzione:**
```bash
# 1. Pulisci tutto
localStorage.clear()

# 2. Verifica file aggiornati
git status

# 3. Riavvia servers
# Backend
cd backend
python server.py

# Frontend
cd frontend
npm start

# 4. Fai nuovo login
```

### Problema: Redirect loop

**Causa:** user_type è null ma l'app pensa sia presente

**Soluzione:**
```javascript
// Console
localStorage.clear();
// Ricarica pagina
```

### Problema: Backend errore 500

**Verifica:**
1. MongoDB è avviato?
   ```bash
   # Test connessione
   mongo --eval "db.version()"
   ```

2. .env configurato?
   ```bash
   cat backend/.env | grep MONGO_URL
   ```

3. Collezioni esistono?
   ```bash
   mongo commit --eval "show collections"
   ```

## 📊 Metriche di Successo

Dopo i test, dovresti avere:
- ✅ 0 errori in console
- ✅ 0 undefined per user_type
- ✅ 100% redirect corretti
- ✅ localStorage sempre aggiornato
- ✅ API sempre con struttura corretta

## 🎉 Test Superati!

Se tutti i test passano:
1. Committa le modifiche
2. Pusha su repository
3. Documenta il fix nel changelog
4. Notifica il team

---

**Tempo stimato per test completi:** 15-20 minuti
**Difficoltà:** ⭐⭐⭐☆☆ (Media)
**Prerequisiti:** Backend e Frontend avviati, MongoDB in esecuzione
