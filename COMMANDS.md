# ⚡ COMANDI RAPIDI - v2.0

## 🚀 Start Servers

### Backend
```bash
cd backend
venv\Scripts\activate          # Windows
source venv/bin/activate       # Linux/Mac
python server_v2.py
```

### Frontend
```bash
cd frontend
npm start
```

---

## 🧪 Test API

### Register
```bash
curl -X POST http://localhost:8000/api/v2/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","full_name":"Test User","user_type":"customer"}'
```

### Login
```bash
curl -X POST http://localhost:8000/api/v2/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'
```

### Get User (sostituisci TOKEN)
```bash
curl http://localhost:8000/api/v2/auth/me \
  -H "Authorization: Bearer TOKEN"
```

---

## 🔍 Debug

### Backend Logs
```bash
tail -f backend/commit.log
```

### Frontend Console
```javascript
// Browser Console
localStorage.getItem('access_token')
localStorage.getItem('user_data')
```

---

## 🗄️ Database

### Backup
```bash
mongodump --db commit --out ./backup_$(date +%Y%m%d)
```

### Restore
```bash
mongorestore --db commit ./backup_20250102
```

### Drop & Reset
```bash
mongo commit --eval "db.dropDatabase()"
```

---

## 📦 Install

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

### Frontend
```bash
cd frontend
npm install
```

---

## 🔧 Config

### Backend .env
```bash
JWT_SECRET_KEY=your-secret-key
MONGO_URL=mongodb://localhost:27017
DB_NAME=commit
```

### Frontend .env
```bash
REACT_APP_API_URL=http://localhost:8000/api/v2
```

---

## 📚 Docs

- Full Docs: `RESTRUCTURE_V2_COMPLETE.md`
- Quick Start: `QUICK_START_V2.md`
- Changelog: `CHANGELOG_V2.md`
- API Docs: http://localhost:8000/docs

---

**Version**: 2.0.0  
**Status**: ✅ READY
