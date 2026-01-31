require('dotenv').config();
const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 80;

const CONVERT_PORT = 3001;
const PDF_PORT = 3002;
const CLOUD_PORT = 3003;

const USERS_FILE = path.join(__dirname, 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'hary-dashboard-fallback-secret';

app.use(express.json());

// ============ USER HELPERS ============

function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    try { return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8')); }
    catch { return []; }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function generatePassword() {
    const letters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const digits = '0123456789';
    let pwd = '';
    for (let i = 0; i < 5; i++) pwd += letters[Math.floor(Math.random() * letters.length)];
    for (let i = 0; i < 5; i++) pwd += digits[Math.floor(Math.random() * digits.length)];
    // Shuffle
    return pwd.split('').sort(() => Math.random() - 0.5).join('');
}

// ============ EMAIL ============

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD
    }
});

async function sendResetEmail(toEmail, newPassword, username) {
    const mailOptions = {
        from: `"Harywang Dashboard" <${process.env.GMAIL_USER}>`,
        to: toEmail,
        subject: 'Reset Password - Harywang Dashboard',
        html: `
            <div style="font-family:Arial,sans-serif;max-width:480px;margin:0 auto;padding:24px;">
                <h2 style="color:#10b981;">Harywang Dashboard</h2>
                <p>Halo <strong>${username}</strong>,</p>
                <p>Password kamu sudah di-reset. Berikut password baru kamu:</p>
                <div style="background:#f3f4f6;padding:16px;border-radius:8px;text-align:center;margin:16px 0;">
                    <code style="font-size:24px;font-weight:bold;color:#1f2937;letter-spacing:2px;">${newPassword}</code>
                </div>
                <p>Segera login dan ganti password kamu setelah masuk.</p>
                <p style="color:#6b7280;font-size:13px;">Jika kamu tidak meminta reset password, abaikan email ini.</p>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}

// ============ AUTH API ============

app.post('/api/register', async (req, res) => {
    const { username, password, email } = req.body;

    if (!username || !password || !email) {
        return res.status(400).json({ error: 'Username, password, dan email wajib diisi' });
    }

    if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
        return res.status(400).json({ error: 'Username: huruf dan angka, 3-20 karakter' });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(password)) {
        return res.status(400).json({ error: 'Password: huruf besar, kecil, dan angka, minimal 8 karakter' });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return res.status(400).json({ error: 'Format email tidak valid' });
    }

    const users = loadUsers();

    if (users.find(u => u.username.toLowerCase() === username.toLowerCase())) {
        return res.status(400).json({ error: 'Username sudah dipakai' });
    }

    if (users.find(u => u.email.toLowerCase() === email.toLowerCase())) {
        return res.status(400).json({ error: 'Email sudah terdaftar' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = {
        id: crypto.randomUUID(),
        username,
        passwordHash,
        email: email.toLowerCase(),
        createdAt: new Date().toISOString()
    };

    users.push(user);
    saveUsers(users);

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, username: user.username });
});

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password wajib diisi' });
    }

    const users = loadUsers();
    const user = users.find(u => u.username.toLowerCase() === username.toLowerCase());

    if (!user) {
        return res.status(401).json({ error: 'Username atau password salah' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ error: 'Username atau password salah' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });
    res.json({ success: true, token, username: user.username });
});

app.post('/api/forgot-password', async (req, res) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email wajib diisi' });
    }

    const users = loadUsers();
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());

    if (!user) {
        // Don't reveal if email exists
        return res.json({ success: true, message: 'Jika email terdaftar, password baru akan dikirim' });
    }

    const newPassword = generatePassword();
    user.passwordHash = await bcrypt.hash(newPassword, 10);
    saveUsers(users);

    try {
        await sendResetEmail(user.email, newPassword, user.username);
        res.json({ success: true, message: 'Password baru sudah dikirim ke email' });
    } catch (err) {
        console.error('[Email Error]', err.message);
        res.status(500).json({ error: 'Gagal mengirim email. Coba lagi nanti.' });
    }
});

app.post('/api/change-password', async (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let decoded;
    try {
        decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    } catch {
        return res.status(401).json({ error: 'Token expired' });
    }

    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Password lama dan baru wajib diisi' });
    }

    if (!/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/.test(newPassword)) {
        return res.status(400).json({ error: 'Password baru: huruf besar, kecil, dan angka, minimal 8 karakter' });
    }

    const users = loadUsers();
    const user = users.find(u => u.id === decoded.id);

    if (!user) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
        return res.status(401).json({ error: 'Password lama salah' });
    }

    user.passwordHash = await bcrypt.hash(newPassword, 10);
    saveUsers(users);

    res.json({ success: true, message: 'Password berhasil diganti' });
});

app.get('/api/me', (req, res) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
        const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
        res.json({ id: decoded.id, username: decoded.username });
    } catch {
        return res.status(401).json({ error: 'Token expired' });
    }
});

// ============ STATIC FILES ============

app.use(express.static(path.join(__dirname, 'public')));

// ============ PROXY ============

app.use('/convert', createProxyMiddleware({
    target: `http://localhost:${CONVERT_PORT}`,
    changeOrigin: true,
    pathRewrite: { '^/convert': '' },
    onError: (err, req, res) => {
        console.error('[Convert Proxy Error]', err.message);
        res.status(502).json({ error: 'Convert service unavailable' });
    }
}));

app.use('/pdf', createProxyMiddleware({
    target: `http://localhost:${PDF_PORT}`,
    changeOrigin: true,
    pathRewrite: { '^/pdf': '' },
    onError: (err, req, res) => {
        console.error('[PDF Proxy Error]', err.message);
        res.status(502).json({ error: 'PDF service unavailable' });
    }
}));

app.use('/cloud', createProxyMiddleware({
    target: `http://localhost:${CLOUD_PORT}`,
    changeOrigin: true,
    pathRewrite: { '^/cloud': '' },
    onError: (err, req, res) => {
        console.error('[Cloud Proxy Error]', err.message);
        res.status(502).json({ error: 'Cloud service unavailable' });
    }
}));

// Health check
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        services: {
            dashboard: 'running',
            convert: `http://localhost:${CONVERT_PORT}`,
            pdf: `http://localhost:${PDF_PORT}`,
            cloud: `http://localhost:${CLOUD_PORT}`
        },
        timestamp: new Date().toISOString()
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log('\n=========================================');
    console.log('   Harywang Dashboard');
    console.log('=========================================\n');
    console.log(`   Main:    http://localhost:${PORT}`);
    console.log(`   Convert: http://localhost:${PORT}/convert`);
    console.log(`   PDF:     http://localhost:${PORT}/pdf`);
    console.log(`   Cloud:   http://localhost:${PORT}/cloud`);
    console.log('\n=========================================\n');
});
