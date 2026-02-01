# 👤 Admin User & Grade Permissions Guide

## 📋 Overview

Sistem **Admin User Management** dan **Grade Permissions** adalah fitur manajemen akses multi-level untuk Harywang Master Panel. Sistem ini memungkinkan Anda membuat banyak admin dengan hak akses berbeda-beda, mirip seperti LMS (Learning Management System).

**Update Date:** 1 Februari 2026  
**Version:** 1.0.0

---

## 🎯 Fitur Utama

### ✅ Admin User Management
- ➕ **Add Admin** - Tambah user admin baru dengan grade tertentu
- ✏️ **Edit Admin** - Update nama, email, password, grade, status
- 🗑️ **Delete Admin** - Hapus admin user (tidak bisa hapus master admin "harywang")
- 👁️ **View All Admins** - List semua admin dengan detail lengkap
- 🔐 **Password Security** - Password di-hash dengan SHA-256
- ⚡ **Status Control** - Active/Inactive per admin

### 🎓 Grade Permissions
- 🏆 **4 Default Grades:**
  - **SUPER_ADMIN** - Full access (warna purple)
  - **ADMIN** - Manage users & view logs (warna biru)
  - **MODERATOR** - View-only most features (warna orange)
  - **VIEWER** - Dashboard read-only (warna abu)

- 🛠️ **Custom Grades:**
  - ➕ Add grade baru dengan permission custom
  - 🗑️ Delete grade (hanya jika tidak ada admin yang pakai)
  - 📊 Visual permission cards dengan icon

### 🔒 Permission Types
Setiap grade bisa mengakses 7 area:
1. 📊 **Dashboard** - View statistik
2. 👥 **Users** - Manage customer users
3. 👤 **Admin** - Manage admin users
4. 🎓 **Grades** - Manage grade permissions
5. 🛡️ **Whitelist** - IP & device tokens
6. 📋 **Logs** - System activity logs
7. ⚙️ **Settings** - System configuration

---

## 📸 Tampilan UI

### Admin User Table
```
+-----+----------+-----------+-------------------+------------+----------------+--------+--------+
| No. | Username | Nama      | Email             | Join Date  | Grade          | Status | Action |
+-----+----------+-----------+-------------------+------------+----------------+--------+--------+
| 1   | harywang | Hary Wang | admin@harywang... | 1 Feb 2026 | [SUPER_ADMIN]  | ACTIVE | ✏️🗑️  |
| 2   | manager1 | Manager A | manager@...       | 1 Feb 2026 | [ADMIN]        | ACTIVE | ✏️🗑️  |
+-----+----------+-----------+-------------------+------------+----------------+--------+--------+
```

### Grade Permission Cards
```
┌─────────────────────────────────────────────────────┐
│ [SUPER_ADMIN] Super Administrator                   │
│ Full access to all features                         │
├─────────────────────────────────────────────────────┤
│ PERMISSIONS:                                        │
│ 📊 dashboard  👥 users  👤 admin  🎓 grades        │
│ 🛡️ whitelist  📋 logs  ⚙️ settings                 │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Cara Menggunakan

### 1️⃣ Menambah Admin Baru

1. Login ke Master Panel: https://harywang.online/adminarea/master
2. Klik menu **"👤 Admin User"** di sidebar
3. Klik tombol **"➕ Add Admin"**
4. Isi form:
   - **Username** - Unique identifier untuk login (huruf kecil, no spasi)
   - **Nama Lengkap** - Nama asli admin
   - **Email** - Email valid
   - **Password** - Min 6 karakter
   - **Grade Permission** - Pilih dari dropdown
   - **Status** - Active/Inactive
5. Klik **"Add Admin"**

### 2️⃣ Edit Admin

1. Di tabel Admin User, klik tombol **"✏️ Edit"**
2. Update field yang ingin diubah
3. **Password**: Kosongkan jika tidak ingin ubah password
4. Klik **"Update Admin"**

### 3️⃣ Hapus Admin

1. Klik tombol **"🗑️"** pada admin yang ingin dihapus
2. Konfirmasi penghapusan
3. ⚠️ **Tidak bisa hapus admin "harywang"** (master admin)

### 4️⃣ Mengelola Grade Permissions

1. Klik menu **"🎓 Grade Permissions"**
2. Lihat semua grade yang tersedia
3. **Add Grade**:
   - Klik **"➕ Add Grade"**
   - Isi Grade ID (huruf besar, contoh: MANAGER, STAFF)
   - Isi nama dan deskripsi
   - Checklist permission yang diinginkan
   - Klik **"Add Grade"**
4. **Delete Grade**:
   - Klik **"🗑️"** pada grade card
   - ⚠️ Tidak bisa hapus grade yang masih digunakan oleh admin

---

## 🔐 Security Features

### Authentication Flow
```
User Login
    ↓
Check IP Whitelist → Granted (instant)
    ↓ (not whitelisted)
Check Registered Device → Granted (no token needed)
    ↓ (not registered)
Check Device Token → Prompt for token
    ↓ (token valid)
Login Credentials Check
    ↓
Check Admin User Exists
    ↓
Check Password Hash (SHA-256)
    ↓
Check Status (active/inactive)
    ↓
Check Grade Permissions
    ↓
Access Granted with Limited Features
```

### Protection Mechanisms
1. ✅ **Password Hashing** - SHA-256 hash, tidak simpan plain text
2. ✅ **Status Control** - Admin inactive tidak bisa login
3. ✅ **Grade Validation** - Grade harus exist di GRADE_PERMISSIONS
4. ✅ **Master Protection** - Username "harywang" tidak bisa dihapus
5. ✅ **Permission Enforcement** - Setiap grade punya akses terbatas
6. ✅ **30-Min Auto Logout** - Inactivity timeout untuk security

---

## 💡 Best Practices

### 🎯 Penggunaan Grade yang Tepat

**SUPER_ADMIN** 👑
- Gunakan untuk: Owner, CTO, Tech Lead
- Jumlah: Maksimal 2-3 orang
- Dapat: Full access, hapus data, manage semua

**ADMIN** 💼
- Gunakan untuk: Manager, Team Lead
- Jumlah: 3-5 orang
- Dapat: Manage users, view logs, tambah IP

**MODERATOR** 🛡️
- Gunakan untuk: CS, Support Staff
- Jumlah: 5-10 orang
- Dapat: View data, moderate content

**VIEWER** 👀
- Gunakan untuk: Analyst, Auditor
- Jumlah: Unlimited
- Dapat: Read-only dashboard

### 🔒 Security Tips

1. **Username Convention**
   - Format: `namaposisi` (contoh: `haryowner`, `dianamanager`)
   - Gunakan lowercase, no spasi
   - Unique per admin

2. **Password Policy**
   - Minimum 8 karakter
   - Kombinasi huruf, angka, simbol
   - Update setiap 3 bulan
   - Jangan share password

3. **Status Management**
   - Set **Inactive** untuk admin yang resign/cuti
   - Jangan langsung delete (keep for audit trail)
   - Delete hanya jika benar-benar tidak diperlukan

4. **Grade Assignment**
   - Principle of Least Privilege (berikan akses minimum yang dibutuhkan)
   - Review grade setiap 6 bulan
   - Buat custom grade untuk role khusus

---

## 🛠️ Technical Details

### Data Structure

```javascript
// Admin Users Map
ADMIN_USERS = Map<username, {
  username: string,
  nama: string,
  email: string,
  password: string (SHA-256 hash),
  grade: string (gradeId),
  status: 'active' | 'inactive',
  joinDate: ISO8601 timestamp
}>

// Grade Permissions Map
GRADE_PERMISSIONS = Map<gradeId, {
  id: string,
  name: string,
  description: string,
  permissions: {
    dashboard: { view, edit, delete },
    users: { view, edit, delete },
    admin: { view, edit, delete },
    grades: { view, edit, delete },
    whitelist: { view, edit, delete },
    logs: { view, edit, delete },
    settings: { view, edit, delete }
  }
}>
```

### API Endpoints

**Admin Users:**
- `GET /api/adminarea/master/admin-users` - List all admins
- `GET /api/adminarea/master/admin-users/:username` - Get single admin
- `POST /api/adminarea/master/admin-users` - Add new admin
- `PUT /api/adminarea/master/admin-users/:username` - Update admin
- `DELETE /api/adminarea/master/admin-users/:username` - Delete admin

**Grade Permissions:**
- `GET /api/adminarea/master/grade-permissions` - List all grades
- `POST /api/adminarea/master/grade-permissions` - Add new grade
- `DELETE /api/adminarea/master/grade-permissions/:gradeId` - Delete grade

### Storage
⚠️ **IMPORTANT:** Data currently stored **IN-MEMORY**
- Admin users dan grade permissions akan **hilang saat server restart**
- Default data akan dimuat kembali (1 admin, 4 grades)
- 🔮 **Future Enhancement:** Implement persistent storage (JSON file atau database)

---

## 🐛 Troubleshooting

### ❌ Error: "Username sudah digunakan"
- **Penyebab:** Username tidak unique
- **Solusi:** Gunakan username berbeda

### ❌ Error: "Grade permission tidak valid"
- **Penyebab:** Grade ID tidak ada di GRADE_PERMISSIONS
- **Solusi:** Pilih grade yang tersedia atau buat grade baru dulu

### ❌ Error: "Tidak dapat menghapus admin harywang"
- **Penyebab:** Protection untuk master admin
- **Solusi:** Master admin tidak bisa dihapus by design

### ❌ Error: "Tidak dapat menghapus grade - masih digunakan"
- **Penyebab:** Ada admin yang menggunakan grade tersebut
- **Solusi:** Update grade admin tersebut ke grade lain, baru hapus grade

### ❌ Admin data hilang setelah restart
- **Penyebab:** Data in-memory belum persistent
- **Solusi Sementara:** Catat semua admin di dokumen external
- **Solusi Permanen:** Implementasi persistent storage (coming soon)

---

## 📈 Future Enhancements

### 🔜 Coming Soon
1. **Persistent Storage** - Save admin users ke JSON file atau SQLite
2. **Audit Trail** - Log semua aktivitas admin (login, add, edit, delete)
3. **Permission Enforcement** - Hide menu berdasarkan grade permission
4. **Role-Based Access Control (RBAC)** - Enforce permission di API level
5. **2FA (Two-Factor Authentication)** - Extra security dengan OTP
6. **Session Management** - Track active sessions per admin
7. **Password Expiry** - Force password change setiap X hari
8. **Login History** - Track login attempts per admin

### 💭 Ideas for Future
- Email notification saat admin baru dibuat
- Admin profile page dengan avatar
- Bulk import admin dari CSV
- Custom permission per feature (granular control)
- Admin activity dashboard (who did what when)

---

## 📞 Support

Jika ada pertanyaan atau issue:
1. Cek dokumentasi ini dulu
2. Check PM2 logs: `pm2 logs cloud-service`
3. Test di browser incognito untuk clear cache
4. Contact developer jika masih error

---

## 📝 Changelog

### Version 1.0.0 (1 Feb 2026)
- ✅ Initial release
- ✅ Admin User CRUD operations
- ✅ Grade Permissions management
- ✅ 4 default grades (SUPER_ADMIN, ADMIN, MODERATOR, VIEWER)
- ✅ Beautiful UI with badge colors
- ✅ Password hashing (SHA-256)
- ✅ Status control (active/inactive)
- ✅ Master admin protection

---

**Built with ❤️ by Harywang Team**  
*"Great power comes with great responsibility"* - With great admin access, manage wisely! 🚀
