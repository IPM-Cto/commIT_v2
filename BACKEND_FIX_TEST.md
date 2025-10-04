# 🔧 BACKEND FIX - Test e Verifica

## 🎯 Problema Risolto

**Sintomo:**
```
⚠️ WARNING: Utente auth0|... non trovato, creando utente di test
❌ DashboardRouter: Unknown user type: undefined
```

**Causa:**
- Backend creava utente "test" senza user_type corretto
- Endpoint `/auth/register` non salvava correttamente user_type
- Endpoint `/auth/me` non cercava in entrambe le collezioni

**Soluzione:**
- ✅ `/auth/register` ora salva CORRETTAMENTE user_type
- ✅ `/auth/me` cerca in users E providers
- ✅ Logging esteso per debug
- ✅ Verifica finale che user_type sia presente

---

## 🚀 Come Testare

### Step 1: Riavvia Backend

```bash
cd backend
python server.py
```

**Verifica nel terminal che vedi:**
```
🚀 Avvio server commIT...
✅ Database connesso
✅ OAuth configurato (o ⚠️ OAuth non configurato - modalità test)
INFO:     Application startup complete
INFO:     Uvicorn running on http://127.0.0.1:8000
```

---

### Step 2: Test Registrazione

1. **Pulisci localStorage:**
   ```javascript
   localStorage.clear();
   ```

2. **Vai su:** http://localhost:3000/register

3. **Apri 2 console:**
   - Browser DevTools (F12) → Console
   - Terminal del backend

4. **Compila form e registrati**

5. **Osserva BACKEND logs:**
   ```
   📥 Registrazione ricevuta: user_type=customer
   🆔 Auth0 ID: auth0|68dd19a127c46312212984d5
   👤 Aggiunta dati customer...
   💾 Salvataggio in collezione 'users'...
   📦 Dati da salvare: user_type=customer, email=test@test.com
   ✅ Utente salvato con ID: 67...
   📤 Response finale: user_type=customer
   ```

6. **Osserva FRONTEND console:**
   ```
   📤 Step 1: Invio registrazione
   ✅ Step 1 completato - Dati ricevuti: {user_type: "customer", ...}
   💾 Step 2: Dati salvati in localStorage
   🎯 Step 3: Redirect immediato a /dashboard/customer
   ```

7. **Verifica redirect:**
   - ✅ Dovresti essere su `/dashboard/customer`
   - ✅ NON dovresti vedere "Unknown user type: undefined"

---

### Step 3: Test Background Verification

Dopo 2 secondi, nel **BACKEND** dovresti vedere:

```
🔍 /auth/me chiamato per: auth0|68dd19a127c46312212984d5
🔍 Ricerca nel database per auth0_id: auth0|68dd19a127c46312212984d5
✅ Trovato in collezione 'users'
📤 Ritorno utente: user_type=customer
```

Nel **FRONTEND** console:

```
📤 Step 4: Verifica in background...
✅ Step 4: Dati verificati dal backend: {user_type: "customer", ...}
✅ Dati sincronizzati correttamente
```

---

### Step 4: Test Navigazione

1. **Clicca su qualsiasi link** nella dashboard

2. **Osserva backend logs:**
   ```
   🔍 /auth/me chiamato per: auth0|68dd19a127c46312212984d5
   ✅ Utente completo trovato: user_type=customer
   📤 Ritorno utente: user_type=customer
   ```

3. **Verifica:**
   - ✅ Navigazione funziona
   - ✅ NO redirect a /register
   - ✅ Backend ritorna sempre user_type corretto

---

## 🐛 Debug Backend

### Script di Test Diretto

Puoi testare il backend direttamente con curl:

```bash
# 1. Ottieni un token (se Auth0 configurato)
# O usa un token fake per test

# 2. Test /auth/me
curl -X GET http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN"

# 3. Test /auth/register
curl -X POST http://localhost:8000/api/auth/register \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_type": "customer",
    "full_name": "Test User",
    "phone": "+39 333 1234567",
    "preferences": ["Ristoranti"]
  }'
```

---

### Log da Cercare

#### ✅ SUCCESSO - Registrazione:

```
📥 Registrazione ricevuta: user_type=customer
🆔 Auth0 ID: auth0|...
👤 Aggiunta dati customer...
💾 Salvataggio in collezione 'users'...
✅ Utente salvato con ID: ...
📤 Response finale: user_type=customer
```

#### ❌ ERRORE - User type mancante:

```
❌ ERRORE CRITICO: user_type mancante prima del save!
```

**Se vedi questo:**
- Problema nel parsing di user_data
- Verifica che frontend invii correttamente user_type

#### ❌ ERRORE - Database:

```
❌ Errore inserimento database: ...
⚠️ Database fallito, ma ritorno dati comunque per test
```

**Se vedi questo:**
- MongoDB non connesso o errore connessione
- Backend continua a funzionare (ritorna dati anche senza save)
- Ma devi risolvere problema database

---

### Verifica Database MongoDB

Se hai MongoDB installato localmente:

```bash
# Connetti a MongoDB
mongo

# Usa database commit
use commit

# Verifica users
db.users.find().pretty()

# Verifica providers
db.providers.find().pretty()

# Cerca per auth0_id specifico
db.users.findOne({"auth0_id": "auth0|68dd19a127c46312212984d5"})
```

---

## 🔍 Troubleshooting

### Problema 1: "Unknown user type: undefined"

**Check 1: Backend logs**
```bash
# Nel terminal backend, cerca:
grep "user_type" logs.txt

# Dovresti vedere:
📥 Registrazione ricevuta: user_type=customer
📤 Response finale: user_type=customer
```

**Check 2: Response API**
```javascript
// In browser console dopo registrazione:
// Guarda nel Network tab → POST /auth/register → Response

// Dovrebbe contenere:
{
  "success": true,
  "user": {
    "user_type": "customer",  ← DEVE ESSERCI!
    ...
  }
}
```

**Fix:**
- Se user_type è undefined nella response → backend problema
- Riavvia backend con modifiche applicate
- Riprova registrazione

---

### Problema 2: Database non connesso

**Sintomo:**
```
❌ Errore connessione database: ...
⚠️ Continuando senza database per test...
```

**Verifica MongoDB:**
```bash
# Check se MongoDB è running
# Windows:
sc query MongoDB

# Linux/Mac:
sudo systemctl status mongod
```

**Avvia MongoDB:**
```bash
# Windows:
net start MongoDB

# Linux/Mac:
sudo systemctl start mongod
```

**Check connessione:**
```bash
# Test connessione
mongo --eval "db.version()"
```

---

### Problema 3: Auth0 non configurato

**Sintomo:**
```
⚠️ OAuth non configurato - modalità test
```

**Fix:**
1. Copia `.env.example` → `.env`
2. Compila con le tue credenziali Auth0:
   ```
   AUTH0_DOMAIN=your-domain.auth0.com
   AUTH0_CLIENT_ID=your-client-id
   AUTH0_CLIENT_SECRET=your-client-secret
   AUTH0_API_AUDIENCE=https://api.commit.it
   ```
3. Riavvia backend

**Nota:** Per test locali, può funzionare anche senza Auth0 configurato.

---

## ✅ Checklist Successo

Dopo le modifiche, verifica:

- [ ] ✅ Backend si avvia senza errori
- [ ] ✅ Database connesso (o modalità test attiva)
- [ ] ✅ POST /auth/register ritorna user con user_type
- [ ] ✅ GET /auth/me ritorna user con user_type
- [ ] ✅ Frontend riceve user_type nella response
- [ ] ✅ localStorage contiene user_type
- [ ] ✅ Redirect funziona correttamente
- [ ] ✅ Navigazione non blocca
- [ ] ✅ Backend logs mostrano emoji ✅ senza ❌
- [ ] ✅ Nessun WARNING "creando utente di test"

---

## 📊 Metriche

| Check | Comportamento Atteso |
|-------|---------------------|
| **Backend startup** | Connesso a DB + OAuth (o modalità test) |
| **POST /auth/register** | Ritorna user con user_type non-null |
| **GET /auth/me** | Ritorna user con user_type non-null |
| **Frontend riceve** | user_type = "customer" o "provider" |
| **localStorage** | user_type presente |
| **Dashboard** | Carica correttamente, no loop |

---

## 🚀 Prossimi Passi

### Se tutto funziona:

1. ✅ Test con entrambi i tipi (customer + provider)
2. ✅ Test reload pagina
3. ✅ Test navigazione
4. ✅ Verifica database popolato correttamente
5. ✅ Deploy staging

### Se ci sono problemi:

1. **Raccogli logs:**
   - Backend terminal output completo
   - Frontend console completo
   - Network tab (POST /auth/register response)

2. **Verifica step by step:**
   - Backend riceve richiesta? ✅
   - Backend salva in database? ✅
   - Backend ritorna user_type? ✅
   - Frontend riceve user_type? ✅
   - localStorage salva user_type? ✅

3. **Contatta supporto** con logs completi

---

**Documento creato:** 28 Gennaio 2025  
**Versione:** 2.0-backend-fix  
**File modificato:** `backend/server.py`

*Buon testing! Il backend ora dovrebbe funzionare correttamente! 🚀*
