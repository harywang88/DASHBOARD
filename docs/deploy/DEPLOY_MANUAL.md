# 🚀 DEPLOY MANUAL KE VPS - Step by Step

## ✅ Perubahan Sudah Di-Push ke Git!

Semua fix sudah di-commit dan push ke GitHub. Sekarang tinggal pull dan restart di VPS.

---

## 📋 Langkah Deploy Manual di VPS

### **Step 1: SSH ke VPS**
```bash
ssh root@144.217.13.125
# Password: sasa1212
```

### **Step 2: Pull Latest Code**
```bash
cd /var/www/harywang-dashboard
git pull origin main
```

### **Step 3: Install Dependencies (PENTING untuk Cloud Service)**
```bash
# Root dependencies
npm install --production

# Convert service
cd services/convert && npm install --production && cd ../..

# PDF service
cd services/pdf/backend && npm install --production && cd ../../..

# Cloud service (CRITICAL - INI YANG PALING PENTING!)
cd services/cloud && npm install --production && cd ../..
```

### **Step 4: Update Nginx Config (CRITICAL FIX)**
```bash
# Backup config lama
sudo cp /etc/nginx/sites-available/harywang.online /etc/nginx/sites-available/harywang.online.backup

# Copy config baru
sudo cp nginx.conf /etc/nginx/sites-available/harywang.online

# Test nginx config
sudo nginx -t

# Jika test OK, reload nginx
sudo systemctl reload nginx
```

### **Step 5: Restart PM2 Services**
```bash
# Restart semua services
pm2 restart ecosystem.config.js

# Atau restart satu-satu jika ada masalah
pm2 restart harywang-dashboard
pm2 restart harywang-convert
pm2 restart harywang-pdf
pm2 restart harywang-cloud

# Check status
pm2 list

# Monitor logs (terutama Cloud service)
pm2 logs harywang-cloud --lines 50
```

---

## 🧪 Testing Setelah Deploy

### 1. Check PM2 Status
```bash
pm2 list
```

**Expected output:**
```
┌─────┬────────────────────────┬─────────┬─────────┬─────────┬──────────┐
│ id  │ name                   │ status  │ restart │ uptime  │ cpu      │
├─────┼────────────────────────┼─────────┼─────────┼─────────┼──────────┤
│ 0   │ harywang-dashboard     │ online  │ 0       │ 2m      │ 0%       │
│ 1   │ harywang-convert       │ online  │ 0       │ 2m      │ 0%       │
│ 2   │ harywang-pdf           │ online  │ 0       │ 2m      │ 0%       │
│ 3   │ harywang-cloud         │ online  │ 0       │ 2m      │ 0%       │ ← HARUS ONLINE!
│ 4   │ webhook                │ online  │ 0       │ 2m      │ 0%       │
└─────┴────────────────────────┴─────────┴─────────┴─────────┴──────────┘
```

### 2. Check Cloud Service Logs
```bash
pm2 logs harywang-cloud --lines 20
```

**Expected output:**
```
[CLOUD] HarywangCloud running on port 3003
[CLOUD] [MASTER PANEL] Admin Users: 1, Grade Permissions: 4
```

### 3. Test API Endpoint
```bash
# Test dari dalam VPS
curl -I http://localhost:3003/adminarea/master-login

# Test API check-access
curl -X POST http://localhost:3003/api/adminarea/master/check-access \
  -H "Content-Type: application/json" \
  -d '{"token":""}'
```

### 4. Test dari Browser
```
https://harywang.online/adminarea/master-login
```

**Harusnya muncul:**
- ✅ Halaman "Akses Ditolak" dengan form Device Token (jika IP belum di whitelist)
- ✅ Atau langsung halaman Login (jika IP sudah di whitelist)

---

## 🐛 Troubleshooting

### Masalah: Cloud service tidak bisa start (module not found)
```bash
cd /var/www/harywang-dashboard/services/cloud
npm install --production --force
pm2 restart harywang-cloud
pm2 logs harywang-cloud
```

### Masalah: 502 Bad Gateway
```bash
# Check apakah service running
pm2 list | grep cloud

# Check logs untuk error
pm2 logs harywang-cloud --lines 100

# Restart service
pm2 restart harywang-cloud
```

### Masalah: 504 Gateway Timeout
```bash
# Check nginx error log
sudo tail -f /var/log/nginx/error.log

# Check apakah port 3003 listening
sudo netstat -tulpn | grep 3003

# Jika tidak ada, restart cloud service
pm2 restart harywang-cloud
```

### Masalah: Nginx config error
```bash
# Test config
sudo nginx -t

# Jika ada error, restore backup
sudo cp /etc/nginx/sites-available/harywang.online.backup /etc/nginx/sites-available/harywang.online
sudo nginx -t
sudo systemctl reload nginx
```

---

## 📊 Monitoring

### Real-time Logs (Semua Services)
```bash
pm2 logs
```

### Real-time Logs (Cloud Service Saja)
```bash
pm2 logs harywang-cloud
```

### Save PM2 Config (agar auto-start saat reboot)
```bash
pm2 save
pm2 startup
```

### Check Memory & CPU Usage
```bash
pm2 monit
```

---

## 🔑 Login Info

**URL Panel:**
```
https://harywang.online/adminarea/master-login
```

**Credentials:**
- Username: `harywang`
- Password: `Harywang2026!`
- PIN: (akan diminta setelah login)

**Device Token:** (jika IP belum di whitelist)
- Lihat di file: `services/cloud/server.js` line 279
- Atau tambah token baru via admin panel setelah login

---

## ✅ Checklist Deploy

- [ ] SSH ke VPS
- [ ] `git pull origin main`
- [ ] Install dependencies (terutama `services/cloud`)
- [ ] Update nginx config
- [ ] Test nginx: `sudo nginx -t`
- [ ] Reload nginx: `sudo systemctl reload nginx`
- [ ] Restart PM2: `pm2 restart ecosystem.config.js`
- [ ] Check status: `pm2 list` (semua harus online)
- [ ] Check logs: `pm2 logs harywang-cloud --lines 20`
- [ ] Test browser: https://harywang.online/adminarea/master-login
- [ ] Test login dengan credentials di atas

---

## 🎉 Selesai!

Setelah semua step selesai, panel seharusnya sudah bisa diakses!

Jika masih ada masalah, kirim screenshot error atau output dari:
```bash
pm2 logs harywang-cloud --lines 50
```
