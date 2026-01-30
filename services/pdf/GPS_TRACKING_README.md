# 🧮 GPS Tracking System - Complete Implementation

Sistem tracking GPS lengkap dengan Aplikasi Android, Backend API, dan Web Dashboard untuk monitoring lokasi real-time.

## ✨ Fitur Utama

### 📱 Aplikasi Android
- ✅ **Real-time GPS Tracking** - Update lokasi setiap 10 detik
- ✅ **Background Service** - Tracking otomatis di background
- ✅ **Settings Panel** - Enable/disable notifikasi
- ✅ **Foreground Notification** - Notifikasi minimal (no sound/vibration)
- ✅ **Auto-start** - Tracking mulai saat boot
- ✅ **Battery Optimization** - Efficient location updates
- ✅ **Logo Kalkulator** - Custom branding

### 🖥️ Web Dashboard
- ✅ **Real-time Map** - Google Maps dengan location markers
- ✅ **Device List** - Daftar semua device online
- ✅ **Location Details** - Latitude, longitude, accuracy, timestamp
- ✅ **Auto Refresh** - Update setiap 10 detik
- ✅ **Responsive Design** - Mobile & desktop friendly
- ✅ **Multiple Devices** - Monitor banyak device sekaligus

### 🔧 Backend API
- ✅ **RESTful Endpoints** - CRUD operations
- ✅ **MongoDB Storage** - Data persistence
- ✅ **Real-time Query** - Fetch latest/history locations
- ✅ **Active Devices** - List devices online
- ✅ **Auto Cleanup** - TTL 90 hari untuk old data
- ✅ **CORS Enabled** - Frontend-backend integration

---

## 📦 Struktur Project

```
gps-tracking/
├── android-gps-tracker/          # 📱 Aplikasi Android (Kotlin)
│   ├── MainActivity.kt            # Main activity dengan UI
│   ├── LocationTrackingService.kt # Foreground service untuk tracking
│   ├── SettingsScreen.kt          # Settings UI (notifikasi, status)
│   ├── LocationApi.kt             # Retrofit API client
│   ├── LocationUpdate.kt          # Data model
│   ├── BootReceiver.kt            # Auto-start receiver
│   ├── AndroidManifest.xml
│   └── app_build.gradle
│
├── gps-backend/                  # 🖥️ Backend API (Node.js)
│   ├── server.js                 # Express server
│   ├── package.json              # Dependencies
│   └── .env                      # Configuration
│
├── gps-dashboard/                # 📊 Web Dashboard
│   ├── index.html                # Interactive dashboard
│   ├── server.js                 # Simple file server
│   └── package.json
│
├── GPS_TRACKING_SETUP.md         # 📖 Dokumentasi lengkap
└── GPS_QUICKSTART.md             # 🚀 Quick start guide
```

---

## 🚀 Quick Start (5 menit)

### 1. Backend
```bash
cd gps-backend
npm install
npm start
# ✅ Running di http://localhost:5000
```

### 2. Dashboard
```bash
cd gps-dashboard
npm install
npm start
# ✅ Running di http://localhost:3000
```

### 3. Android App
- Open Android Studio
- Create new Kotlin project
- Copy `.kt` files ke package `com.gps.tracker`
- Update `build.gradle` & `AndroidManifest.xml`
- Set BASE_URL: `http://10.0.2.2:5000` (emulator)
- Build & Run

---

## 📊 Data Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                     ANDROID DEVICE                              │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  GPS Tracking Service                                     │  │
│  │  - Update interval: 10 seconds                            │  │
│  │  - Accuracy: ≤ 10 meters                                 │  │
│  │  - Background enabled                                    │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│                      LocationApi                                  │
│                    (Retrofit + JSON)                              │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                      HTTP POST
            http://backend:5000/api/location/update
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                     BACKEND API                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Express.js Server                                        │  │
│  │  - Validate location data                                │  │
│  │  - Store to MongoDB                                      │  │
│  │  - Provide REST endpoints                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                            ↓                                      │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  MongoDB Database                                         │  │
│  │  - Collections: locations                                │  │
│  │  - TTL: 90 days                                          │  │
│  │  - Indexed: deviceId, timestamp                          │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                            ↓
                      HTTP GET
            http://backend:5000/api/devices/active
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                    WEB DASHBOARD                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  HTML5 + Google Maps API                                 │  │
│  │  - Display device locations                              │  │
│  │  - Show location details                                 │  │
│  │  - Real-time map updates                                 │  │
│  │  - Auto-refresh every 10s                                │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                   │
│                     👨‍💻 User (PC Monitor)                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔐 Android Permissions

Required permissions:
- `ACCESS_FINE_LOCATION` - GPS presisi tinggi
- `ACCESS_COARSE_LOCATION` - Network location fallback
- `ACCESS_BACKGROUND_LOCATION` - Background tracking
- `INTERNET` - API communication
- `POST_NOTIFICATIONS` - Send notifications
- `RECEIVE_BOOT_COMPLETED` - Auto-start after reboot

---

## 📡 API Endpoints

| Endpoint | Method | Purpose | Auth |
|----------|--------|---------|------|
| `/api/location/update` | POST | Send location | ❌ |
| `/api/location/latest/:deviceId` | GET | Get latest location | ❌ |
| `/api/location/history/:deviceId` | GET | Get location history | ❌ |
| `/api/devices/active` | GET | Get active devices | ❌ |
| `/api/health` | GET | Health check | ❌ |

**Note:** Untuk production, tambahkan authentication (JWT).

---

## ⚙️ Konfigurasi

### Backend (.env)
```env
MONGODB_URI=mongodb://localhost:27017/gps-tracker
PORT=5000
NODE_ENV=development
```

### Android (LocationApi.kt)
```kotlin
private const val BASE_URL = "http://10.0.2.2:5000/" // Emulator
// atau
private const val BASE_URL = "http://192.168.x.x:5000/" // Device
```

### Dashboard (index.html)
```javascript
const API_URL = 'http://localhost:5000';
const GOOGLE_MAPS_API_KEY = 'YOUR_KEY_HERE';
```

---

## 🧪 Testing

### Test Backend
```bash
# Health check
curl http://localhost:5000/api/health

# Send test location
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

# Get active devices
curl http://localhost:5000/api/devices/active
```

### Test Dashboard
- Open http://localhost:3000 di browser
- Verify devices muncul
- Click device untuk see location details

### Test Android App
1. Install APK ke emulator/device
2. Allow all permissions
3. Click "Mulai Tracking"
4. Verify di dashboard dalam 10-20 detik

---

## 🎛️ Settings Android

### Di Aplikasi Android:
**⚙️ Pengaturan Tab:**
- 🔔 **Notifikasi Aplikasi** - Enable/disable notification
- 📍 **Status Tracking** - View tracking status

**Default:**
- Notifications: ✅ Enabled
- Tracking: ✅ Enabled
- Update Interval: 10 seconds
- Notification: No sound, no vibration

---

## 📱 Notifikasi

Aplikasi menampilkan foreground notification dengan:
- ✅ Title: "GPS Tracking Active"
- ✅ Message: "Location tracking in progress"
- ✅ Icon: Calculator logo 🧮
- ✅ Priority: LOW
- ✅ Sound: OFF
- ✅ Vibration: OFF

Dapat di-disable di Settings → Notifikasi Aplikasi

---

## 🎨 UI Screenshots

### Android App
- **Main Screen**: Status tracking + Start/Stop button
- **Settings Screen**: Notification toggle, tracking status, app info

### Web Dashboard
- **Header**: Active devices count, last update time
- **Devices Panel**: List devices dengan location info
- **Details Panel**: Selected device details
- **Map View**: Google Maps dengan device markers

---

## 📈 Performance

- **Location Update**: 10 seconds (dapat di-adjust)
- **Dashboard Refresh**: 10 seconds
- **Database TTL**: 90 days
- **Memory Usage**: ~50-100 MB (Android app)
- **Battery Impact**: Minimal (uses high-accuracy GPS)

---

## 🔧 Troubleshooting

### Backend tidak start
```
Error: Cannot find module 'express'
Solution: npm install di gps-backend folder
```

### Dashboard blank / 404
```
Error: Cannot GET /
Solution: Pastikan di gps-dashboard folder saat npm start
```

### Android not connecting
```
Error: Unable to connect to backend
Solution 1: Ubah IP ke 10.0.2.2:5000 (emulator)
Solution 2: Cek firewall
Solution 3: Pastikan backend running di port 5000
```

### Notifikasi tetap muncul
```
Solution: 
1. Go to Android Settings → App → Notifications
2. Disable "GPS Tracking Active" notification
3. Atau disable di app Settings tab
```

### MongoDB connection error
```
Error: connect ECONNREFUSED 127.0.0.1:27017
Solution 1: mongod (start local MongoDB)
Solution 2: Gunakan MongoDB Atlas (cloud)
Solution 3: Update connection string di .env
```

---

## 🚀 Production Deployment

### Recommendations:
1. **Authentication** - Tambah JWT token
2. **HTTPS** - Gunakan SSL certificate
3. **Environment** - Deploy ke cloud (Heroku, AWS, Google Cloud)
4. **Database** - Gunakan MongoDB Atlas
5. **Rate Limiting** - Prevent abuse
6. **Logging** - Add comprehensive logging
7. **Monitoring** - Setup alerts

---

## 📚 Documentation

- [📖 GPS_TRACKING_SETUP.md](./GPS_TRACKING_SETUP.md) - Dokumentasi lengkap
- [🚀 GPS_QUICKSTART.md](./GPS_QUICKSTART.md) - Quick start guide

---

## 💡 Fitur Mendatang

- [ ] Device authentication & login
- [ ] Geofencing alerts
- [ ] Location history export
- [ ] Multiple device groups
- [ ] Push notifications untuk alerts
- [ ] Admin dashboard
- [ ] Statistics & analytics
- [ ] Database backup automation

---

## 📝 Technical Stack

| Component | Technology | Version |
|-----------|-----------|---------|
| **Android App** | Kotlin | 1.9.0 |
| **Android SDK** | Jetpack Compose | 1.5.4 |
| **Backend** | Node.js | 18+ |
| **Framework** | Express.js | 4.18.2 |
| **Database** | MongoDB | 5.0+ |
| **Maps** | Google Maps API | v3 |
| **Frontend** | HTML5/CSS3/JS | Modern |

---

## 📞 Support & Issues

Jika ada masalah atau pertanyaan:
1. Check dokumentasi di GPS_TRACKING_SETUP.md
2. Review troubleshooting section
3. Check browser console (F12) untuk error details
4. Check Android Logcat untuk app logs

---

## 📄 License

Proprietary - All rights reserved

---

## 👨‍💻 Development

**Created:** January 27, 2024  
**Last Updated:** January 27, 2024  
**Version:** 1.0.0

---

**Ready to track! 🚀📍**
