# Harywang Dashboard

Dashboard terintegrasi untuk File Converter dan PDF Tools.

**Domain:** harywang.online

## Struktur Folder

```
DASHBOARD/
├── public/
│   └── index.html          # Dashboard utama
├── services/
│   ├── convert/            # File Converter service
│   └── pdf/                # PDF Tools service
├── server.js               # Main dashboard server
├── start.js                # Unified startup script
├── start.bat               # Windows launcher
├── start.sh                # Linux launcher
├── nginx.conf              # Nginx configuration
├── ecosystem.config.js     # PM2 configuration
└── package.json
```

## Quick Start (Lokal)

### Windows
```bash
cd DASHBOARD
start.bat
```

### Linux/Mac
```bash
cd DASHBOARD
chmod +x start.sh
./start.sh
```

Akses: http://localhost (atau port 80)

---

## Rekomendasi Hosting

### **REKOMENDASI: VPS Ubuntu + Nginx**

**Mengapa Ubuntu VPS?**
- Full control & flexibility
- Node.js native support
- FFmpeg, ImageMagick, Ghostscript support
- SSL gratis dengan Let's Encrypt
- Process management dengan PM2
- Cost effective ($5-10/bulan)

**Provider yang bagus:**
- DigitalOcean ($4-6/mo)
- Vultr ($5/mo)
- Linode ($5/mo)
- Contabo ($4/mo)
- IDCloudHost (Indonesia, Rp50k/mo)

**Spesifikasi minimum:**
- RAM: 2GB
- CPU: 1-2 vCPU
- Storage: 25GB SSD
- OS: Ubuntu 22.04 LTS

---

## Setup di VPS Ubuntu

### 1. Persiapan Server

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install tools yang dibutuhkan
sudo apt install -y ffmpeg imagemagick ghostscript nginx git

# Install PM2 globally
sudo npm install -g pm2
```

### 2. Upload Project

```bash
# Buat directory
sudo mkdir -p /var/www/harywang-dashboard
sudo chown -R $USER:$USER /var/www/harywang-dashboard

# Upload files (dari komputer lokal)
scp -r DASHBOARD/* user@server:/var/www/harywang-dashboard/

# Atau clone dari git (jika ada)
git clone https://github.com/username/harywang-dashboard.git /var/www/harywang-dashboard
```

### 3. Install Dependencies

```bash
cd /var/www/harywang-dashboard

# Install dashboard dependencies
npm install

# Install convert service dependencies
cd services/convert
npm install

# Install PDF service dependencies
cd ../pdf/backend
npm install
```

### 4. Setup Nginx

```bash
# Copy nginx config
sudo cp /var/www/harywang-dashboard/nginx.conf /etc/nginx/sites-available/harywang.online

# Enable site
sudo ln -s /etc/nginx/sites-available/harywang.online /etc/nginx/sites-enabled/

# Remove default
sudo rm /etc/nginx/sites-enabled/default

# Test & reload
sudo nginx -t
sudo systemctl reload nginx
```

### 5. Setup SSL dengan Let's Encrypt

```bash
# Install certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d harywang.online -d www.harywang.online

# Auto-renewal (sudah otomatis tapi pastikan)
sudo certbot renew --dry-run
```

### 6. Start dengan PM2

```bash
cd /var/www/harywang-dashboard

# Start semua services
pm2 start ecosystem.config.js

# Save PM2 config
pm2 save

# Auto-start on boot
pm2 startup
```

### 7. Monitoring

```bash
# Lihat status
pm2 status

# Lihat logs
pm2 logs

# Monitor realtime
pm2 monit

# Restart semua
pm2 restart all
```

---

## Setup Domain

### DNS Configuration

Di domain registrar (Namecheap, Cloudflare, dll):

| Type | Name | Value |
|------|------|-------|
| A | @ | [IP VPS] |
| A | www | [IP VPS] |

Tunggu propagasi DNS (5 menit - 24 jam).

---

## Alternatif Hosting

### Option 2: Railway / Render (PaaS)

**Kelebihan:**
- Setup mudah
- Auto-deploy dari Git
- Free tier tersedia

**Kekurangan:**
- Limited control
- Mungkin perlu bayar untuk FFmpeg support
- Cold start delay di free tier

### Option 3: Docker + VPS

```bash
# Build image
docker build -t harywang-dashboard .

# Run container
docker run -d -p 80:80 -p 443:443 harywang-dashboard
```

### ❌ TIDAK DISARANKAN: XAMPP

XAMPP tidak cocok karena:
- XAMPP untuk PHP, bukan Node.js
- Tidak ada native FFmpeg support
- Tidak production-ready
- Tidak ada SSL built-in

---

## Troubleshooting

### Port sudah digunakan
```bash
# Cek port yang digunakan
sudo lsof -i :80
sudo lsof -i :3001
sudo lsof -i :3002

# Kill process
sudo kill -9 [PID]
```

### Permission denied
```bash
sudo chown -R $USER:$USER /var/www/harywang-dashboard
sudo chmod -R 755 /var/www/harywang-dashboard
```

### FFmpeg tidak ditemukan
```bash
sudo apt install ffmpeg
ffmpeg -version
```

### Nginx error
```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### PM2 tidak jalan
```bash
pm2 logs harywang-dashboard --lines 100
pm2 restart all
```

---

## Environment Variables

```bash
# Create .env file
PORT=8080                    # Dashboard port
CONVERT_PORT=3001           # Convert service port
PDF_PORT=3002               # PDF service port
NODE_ENV=production         # Environment
```

---

## Support

- Website: https://harywang.online
- Issue: [GitHub Issues]

---

**Made with ❤️ by Harywang**
