# Quick Start Guide

## 🎯 3 Langkah Setup Cepat

### Langkah 1: Start Backend (5 menit)

```bash
cd gps-backend

# Install dependencies
npm install

# Start server
npm start
```

✅ Backend running di `http://localhost:5000`

---

### Langkah 2: Start Dashboard (2 menit)

```bash
cd gps-dashboard

# Install dependencies  
npm install

# Start dashboard
npm start
```

✅ Dashboard running di `http://localhost:3000`

Buka browser: http://localhost:3000

---

### Langkah 3: Setup Android App (15 menit)

1. Buka Android Studio
2. Create New Project (Empty Activity, Kotlin)
3. Copy semua `.kt` files ke package `com.gps.tracker`
4. Update `build.gradle` dengan dependencies
5. Update `AndroidManifest.xml`
6. Update BASE_URL di `LocationApi.kt` ke `http://10.0.2.2:5000`
7. Build & run

✅ Aplikasi akan start tracking

---

## 🧪 Test Connection

### Dari Terminal:
```bash
# Test backend API
curl http://localhost:5000/api/health

# Test dashboard
curl http://localhost:3000
```

### Dari Browser:
- Backend: http://localhost:5000/api/health
- Dashboard: http://localhost:3000

---

## 📱 Test Android App

Setelah app running:

1. **Allow Permissions** - Accept all permissions saat diminta
2. **Start Tracking** - Klik tombol "Mulai Tracking"
3. **Check Dashboard** - Lihat di http://localhost:3000
4. **Device akan muncul** dalam 10-20 detik

---

## 🛠️ Troubleshooting Cepat

| Masalah | Solusi |
|---------|--------|
| Backend error | Check MongoDB running: `mongod` |
| Dashboard blank | Hard refresh: `Ctrl+F5` |
| Android tidak connect | Ubah IP ke `10.0.2.2:5000` (emulator) |
| Notifikasi ada | Disable di Settings app Android |

---

## 📊 Struktur Data

**Location Update dari Android:**
```json
{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10.5,
  "provider": "gps",
  "timestamp": "2024-01-27T10:30:00Z",
  "deviceId": "device-123"
}
```

**Database Schema (MongoDB):**
```
locations {
  _id: ObjectId
  deviceId: String (indexed)
  latitude: Number
  longitude: Number
  accuracy: Number
  provider: String
  timestamp: Date (indexed, TTL: 90 days)
  createdAt: Date
}
```

---

## 🎨 Custom Logo

Logo kalkulator 🧮 sudah ada di:
- Dashboard header
- Android notification

Untuk ganti:
1. Prepare image file (PNG, recommended 192x192px)
2. Copy ke `android-gps-tracker/res/drawable/ic_calculator.png`
3. Update reference di code jika diperlukan

---

## 📞 API Quick Reference

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/location/update` | POST | Send location dari Android |
| `/api/location/latest/:deviceId` | GET | Get latest location |
| `/api/location/history/:deviceId` | GET | Get location history |
| `/api/devices/active` | GET | Get all active devices |
| `/api/health` | GET | Health check |

---

**Ready to track!** 🚀
