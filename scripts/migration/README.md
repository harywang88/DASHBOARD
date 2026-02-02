# 🚀 Migration Scripts - VPS ke Server Lokal

Script untuk migrasi Harywang Dashboard dari VPS ke server lokal Ubuntu 22.04.

## 📋 Urutan Eksekusi

```
1-backup-vps.sh          → Backup semua data dari VPS
2-setup-local-server.sh  → Setup server lokal (Node, PostgreSQL, PM2, dll)
3-restore-backup.sh      → Restore backup ke server lokal
4-auto-deploy.sh         → Setup auto-deploy & watch mode
5-monitoring.sh          → Dashboard monitoring real-time
6-setup-cloudflare-tunnel.sh → Setup public access via domain
```

## 🔧 Quick Start

### Step 1: Backup VPS (dari komputer lokal)
```bash
chmod +x *.sh
./1-backup-vps.sh
```

### Step 2: Setup Server Lokal (di server Ubuntu)
```bash
# Copy scripts ke server lokal
scp -r scripts/migration user@server-lokal:/tmp/

# SSH ke server lokal
ssh user@server-lokal

# Jalankan setup
cd /tmp/migration
sudo ./2-setup-local-server.sh
```

### Step 3: Restore Backup
```bash
# Copy folder backup ke server lokal
scp -r backups/20260202_* user@server-lokal:/tmp/

# Restore
./3-restore-backup.sh /tmp/20260202_*
```

### Step 4: Setup Tailscale (Remote Access)
```bash
sudo tailscale up
# Login via browser, dapatkan IP Tailscale
tailscale ip -4
```

### Step 5: Setup Cloudflare Tunnel (Public Access)
```bash
./6-setup-cloudflare-tunnel.sh
# Follow browser auth
```

### Step 6: Auto-Deploy & Monitoring
```bash
./4-auto-deploy.sh  # Pilih mode watch
./5-monitoring.sh   # Dashboard monitoring
```

## 📊 Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                    INTERNET                             │
└─────────────────────────┬───────────────────────────────┘
                          │
          ┌───────────────┴───────────────┐
          │     Cloudflare Tunnel         │
          │   (harywang.online → local)   │
          └───────────────┬───────────────┘
                          │
┌─────────────────────────┴───────────────────────────────┐
│                 SERVER LOKAL                            │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐     │
│  │   Nginx     │  │  Tailscale  │  │ cloudflared │     │
│  │   :80       │  │  (VPN)      │  │  (tunnel)   │     │
│  └──────┬──────┘  └─────────────┘  └─────────────┘     │
│         │                                               │
│  ┌──────┴──────────────────────────────────────────┐   │
│  │                    PM2                           │   │
│  ├──────────────┬──────────────┬──────────────────┤   │
│  │ Dashboard    │ Convert      │ PDF      │ Cloud │   │
│  │ :8080        │ :3001        │ :3002    │ :3003 │   │
│  └──────────────┴──────────────┴──────────────────┘   │
│                          │                             │
│  ┌───────────────────────┴───────────────────────┐    │
│  │              PostgreSQL :5432                  │    │
│  └────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────┘
```

## 🔐 Akses

| Metode | URL/IP | Keterangan |
|--------|--------|------------|
| Local | http://localhost | Dari server itu sendiri |
| Tailscale | http://100.x.x.x | Remote access via VPN |
| Public | https://harywang.online | Via Cloudflare Tunnel |

## 📝 Catatan Penting

1. **Edit .env** setelah restore - sesuaikan dengan server lokal
2. **PostgreSQL password** - ganti password default
3. **Firewall** - pastikan UFW aktif
4. **SSL** - Cloudflare Tunnel otomatis handle SSL

## 🛠️ Troubleshooting

### PM2 tidak jalan
```bash
pm2 list
pm2 logs
pm2 restart ecosystem.config.js
```

### Cloudflare Tunnel error
```bash
sudo systemctl status cloudflared
sudo journalctl -u cloudflared -f
cloudflared tunnel run harywang-local  # manual run
```

### PostgreSQL connection refused
```bash
sudo systemctl status postgresql
sudo -u postgres psql
# Check pg_hba.conf jika perlu
```

### Port sudah dipakai
```bash
sudo netstat -tulpn | grep :80
sudo kill -9 <PID>
```
