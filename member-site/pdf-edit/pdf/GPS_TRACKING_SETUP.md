# GPS Tracking System - Dokumentasi Lengkap

## 📱 Deskripsi Sistem

Sistem tracking GPS lengkap dengan 3 komponen:
1. **Aplikasi Android** - Tracking lokasi real-time dengan settingan notifikasi
2. **Backend API** - Node.js server untuk menerima & menyimpan data lokasi
3. **Web Dashboard** - Panel monitoring lokasi device dari PC

---

## 🏗️ Struktur Project

```
gps-tracking/
├── android-gps-tracker/      # Aplikasi Android
│   ├── MainActivity.kt
│   ├── LocationTrackingService.kt
│   ├── SettingsScreen.kt
│   ├── LocationApi.kt
│   ├── LocationUpdate.kt
│   ├── BootReceiver.kt
│   ├── AndroidManifest.xml
│   └── build.gradle
├── gps-backend/              # Backend Node.js
│   ├── server.js
│   ├── package.json
│   └── .env
└── gps-dashboard/            # Web Dashboard
    ├── index.html
    ├── server.js
    └── package.json
```

---

## 🚀 Setup & Installation

### Backend Setup (Node.js)

```bash
# 1. Install dependencies
cd gps-backend
npm install

# 2. Setup MongoDB
# Option A: Local MongoDB
mongod

# Option B: MongoDB Atlas (Cloud)
# Edit .env file dengan connection string Anda

# 3. Update .env file
MONGODB_URI=mongodb://localhost:27017/gps-tracker
PORT=5000

# 4. Start server
npm start
# Server akan running di http://localhost:5000
```

### Dashboard Setup (Web)

```bash
# 1. Install dependencies
cd gps-dashboard
npm install

# 2. Update API URL di index.html
# Buka index.html dan ubah:
const API_URL = 'http://localhost:5000';

# 3. Update Google Maps API Key
# Di bagian <script> ganti YOUR_GOOGLE_MAPS_API_KEY dengan key Anda

# 4. Start dashboard
npm start
# Dashboard akan running di http://localhost:3000
```

### Android App Setup

#### Requirement:
- Android Studio (versi terbaru)
- Android SDK 24+
- Kotlin 1.9.0+
- Google Play Services

#### Langkah:

1. **Buat project baru di Android Studio**
   - Create New Project
   - Select "Empty Activity"
   - Language: Kotlin
   - Min SDK: 24 (Android 7.0)

2. **Copy files ke project:**
   - Copy `MainActivity.kt` ke `app/src/main/java/com/gps/tracker/`
   - Copy `LocationTrackingService.kt` ke `app/src/main/java/com/gps/tracker/service/`
   - Copy `SettingsScreen.kt` ke `app/src/main/java/com/gps/tracker/ui/`
   - Copy `LocationApi.kt` ke `app/src/main/java/com/gps/tracker/api/`
   - Copy `LocationUpdate.kt` ke `app/src/main/java/com/gps/tracker/data/`
   - Copy `BootReceiver.kt` ke `app/src/main/java/com/gps/tracker/receiver/`

3. **Update build.gradle**
   - Copy dependencies dari `app_build.gradle` ke `app/build.gradle` Anda

4. **Update AndroidManifest.xml**
   - Copy permissions dan components dari `AndroidManifest.xml`

5. **Update Base URL**
   - Di `LocationApi.kt`, ubah:
     ```kotlin
     private const val BASE_URL = "http://your-backend-api.com/"
     ```
   - Ganti dengan IP/URL backend Anda
   - Jika development di emulator: `http://10.0.2.2:5000/`

6. **Generate APK & Install**
   ```
   Build > Build Bundle(s)/APK(s) > Build APK(s)
   ```

---

## ⚙️ Konfigurasi Android App

### 1. **Notifikasi Setting**
Buka SettingsScreen di aplikasi untuk:
- ✅ Enable/Disable notifikasi tracking
- ✅ Enable/Disable tracking service
- Notifikasi minimal (no sound, no vibration)

### 2. **Logo Kalkulator**
- Logo 🧮 sudah diintegrasikan di:
  - Launcher icon
  - Notification icon
  - Dashboard
- Untuk custom logo:
  1. Simpan gambar calculator di `res/drawable/ic_calculator.png`
  2. Update di `LocationTrackingService.kt`:
     ```kotlin
     .setSmallIcon(R.drawable.ic_calculator)
     ```

### 3. **Permissions Required**
Aplikasi memerlukan:
- `ACCESS_FINE_LOCATION` - GPS presisi tinggi
- `ACCESS_COARSE_LOCATION` - Network location
- `ACCESS_BACKGROUND_LOCATION` - Tracking di background
- `INTERNET` - Komunikasi dengan backend
- `POST_NOTIFICATIONS` - Notifikasi (Android 13+)

---

## 📡 API Endpoints

### 1. Update Lokasi (dari Android)
```
POST /api/location/update
Content-Type: application/json

{
  "latitude": -6.2088,
  "longitude": 106.8456,
  "accuracy": 10.5,
  "provider": "gps",
  "timestamp": "2024-01-27T10:30:00Z",
  "deviceId": "device-123"
}

Response:
{
  "success": true,
  "message": "Location updated successfully",
  "data": { ...location object... }
}
```

### 2. Get Latest Lokasi
```
GET /api/location/latest/:deviceId

Response:
{
  "success": true,
  "data": {
    "_id": "...",
    "deviceId": "device-123",
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10.5,
    "timestamp": "2024-01-27T10:30:00Z"
  }
}
```

### 3. Get Location History
```
GET /api/location/history/:deviceId?limit=100&days=7

Response:
{
  "success": true,
  "count": 87,
  "data": [ ...array of locations... ]
}
```

### 4. Get Active Devices
```
GET /api/devices/active

Response:
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "device-123",
      "lastLocation": { ...location object... },
      "updateCount": 45
    }
  ]
}
```

### 5. Health Check
```
GET /api/health

Response:
{
  "status": "OK",
  "message": "GPS Tracking Backend is running"
}
```

---

## 📊 Web Dashboard Features

### Dashboard Menampilkan:
1. **Active Devices** - Jumlah device online
2. **Device List** - Daftar semua device dengan lokasi terbaru
3. **Location Details** - Detail lokasi device yang dipilih
4. **Map View** - Peta real-time dengan marker device
5. **Auto Refresh** - Update otomatis setiap 10 detik

### Interaksi:
- Klik device di list untuk melihat detail & location di map
- Klik marker di map untuk info popup
- Tombol Refresh untuk manual update
- Responsive design untuk mobile & desktop

---

## 🔧 Troubleshooting

### Android App tidak connect ke backend:
1. Pastikan backend sudah running
2. Cek IP/URL backend di `LocationApi.kt`
3. Cek firewall/network
4. Di emulator, gunakan `10.0.2.2:5000` bukan `localhost:5000`

### Backend error MongoDB:
```bash
# Install MongoDB lokal atau gunakan Atlas
# Test connection:
mongosh "mongodb://localhost:27017"
```

### Dashboard tidak menampilkan devices:
1. Pastikan backend running
2. Cek browser console (F12) untuk error
3. Cek CORS settings di backend
4. Update Google Maps API key

### Notifikasi muncul padahal sudah di-disable:
- Clear app data & reinstall
- Check SharedPreferences di developer options

---

## 📈 Data Flow

```
Android App
    ↓ (GPS Location every 10s)
Backend API
    ↓ (Store ke MongoDB)
Database (MongoDB)
    ↓ (Query data)
Web Dashboard
    ↓ (Display di map & list)
User PC Monitor
```

---

## 🔐 Security Notes

Untuk production:
1. **API Authentication** - Tambah JWT token
2. **HTTPS** - Gunakan SSL certificate
3. **Data Encryption** - Encrypt location data di transit
4. **Database Security** - Ubah default password MongoDB
5. **CORS** - Restrict origins
6. **Rate Limiting** - Prevent abuse

---

## 📱 Testing

### Android App:
```bash
# Build & run di emulator
./gradlew emulatorDebug

# Atau install ke device fisik
adb install app-debug.apk
```

### Backend:
```bash
# Test API
curl -X POST http://localhost:5000/api/location/update \
  -H "Content-Type: application/json" \
  -d '{
    "latitude": -6.2088,
    "longitude": 106.8456,
    "accuracy": 10.5,
    "provider": "gps",
    "timestamp": "2024-01-27T10:30:00Z",
    "deviceId": "test-device"
  }'
```

---

## 📝 Notes

- Default update interval: 10 detik
- Data retention: 90 hari (TTL di MongoDB)
- Max history query: 100 records
- Foreground service untuk background tracking
- AutoStart setelah boot via BroadcastReceiver

---

## 🎯 Fitur Mendatang

- [ ] Device authentication & login
- [ ] Geofencing alerts
- [ ] Location history export (CSV/PDF)
- [ ] Multiple device management
- [ ] Push notifications untuk alerts
- [ ] Database backup otomatis
- [ ] Admin panel untuk manage devices

---

## 👨‍💻 Support

Untuk pertanyaan atau issue, silakan hubungi tim development.

**Last Updated:** 27 Januari 2024
