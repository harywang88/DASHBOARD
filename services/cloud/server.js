const express = require('express');
const multer = require('multer');
const cors = require('cors');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3003;

const STORAGE_DIR = path.join(__dirname, 'storage');
const META_FILE = path.join(__dirname, 'metadata.json');
const USERS_FILE = path.join(__dirname, '..', '..', 'users.json');
const JWT_SECRET = process.env.JWT_SECRET || 'hary-dashboard-fallback-secret';  // Same as main dashboard
const MAX_STORAGE = 20 * 1024 * 1024 * 1024; // 20GB
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB per file

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'frontend')));

if (!fs.existsSync(STORAGE_DIR)) fs.mkdirSync(STORAGE_DIR, { recursive: true });

// ============ DATA HELPERS ============

function loadMeta() {
    if (!fs.existsSync(META_FILE)) return { files: [], folders: [] };
    try {
        const data = JSON.parse(fs.readFileSync(META_FILE, 'utf-8'));
        if (Array.isArray(data)) return { files: data, folders: [] };
        return data;
    } catch { return { files: [], folders: [] }; }
}

function saveMeta(data) {
    fs.writeFileSync(META_FILE, JSON.stringify(data, null, 2));
}

function loadUsers() {
    if (!fs.existsSync(USERS_FILE)) return [];
    try {
        return JSON.parse(fs.readFileSync(USERS_FILE, 'utf-8'));
    } catch { return []; }
}

function saveUsers(users) {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

function getTotalUsed(username) {
    const meta = loadMeta();
    if (username === 'harywang') {
        // Master user sees all
        return meta.files.reduce((sum, f) => sum + f.size, 0);
    }
    // Regular user sees only their files
    return meta.files.filter(f => f.owner === username).reduce((sum, f) => sum + f.size, 0);
}

// ============ AUTH MIDDLEWARE ============

function verifyToken(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Token tidak ada' });
    }

    const token = authHeader.substring(7);
    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // { username }
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token tidak valid' });
    }
}

// ============ MASTER PANEL CONFIG ============

// Master panel credentials config file
const CREDENTIALS_FILE = path.join(__dirname, 'master-credentials.json');

// Load or create credentials
function loadMasterCredentials() {
    if (fs.existsSync(CREDENTIALS_FILE)) {
        try {
            return JSON.parse(fs.readFileSync(CREDENTIALS_FILE, 'utf-8'));
        } catch (error) {
            console.error('Error loading credentials:', error);
        }
    }
    // Default credentials
    const defaultCreds = {
        username: 'harywang',
        password: crypto.createHash('sha256').update('Harywang2026!').digest('hex')
    };
    saveMasterCredentials(defaultCreds);
    return defaultCreds;
}

function saveMasterCredentials(credentials) {
    fs.writeFileSync(CREDENTIALS_FILE, JSON.stringify(credentials, null, 2));
}

// Load credentials at startup
const MASTER_PANEL_CREDENTIALS = loadMasterCredentials();

// ==================== DATA PERSISTENCE ====================
const DATA_DIR = path.join(__dirname, 'data');
const ADMIN_USERS_FILE = path.join(DATA_DIR, 'admin-users.json');
const ACTIVITY_LOGS_FILE = path.join(DATA_DIR, 'activity-logs.json');
const GRADE_PERMISSIONS_FILE = path.join(DATA_DIR, 'grade-permissions.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Load data from JSON files
function loadAdminUsers() {
    try {
        if (fs.existsSync(ADMIN_USERS_FILE)) {
            const data = JSON.parse(fs.readFileSync(ADMIN_USERS_FILE, 'utf8'));
            const adminMap = new Map(Object.entries(data));
            
            // Auto-migration: Add default PIN to old users who don't have one
            let needsSave = false;
            const defaultPin = crypto.createHash('sha256').update('123456').digest('hex');
            
            for (const [username, admin] of adminMap.entries()) {
                if (!admin.pin) {
                    console.log(`[MIGRATION] Adding default PIN to user: ${username}`);
                    admin.pin = defaultPin;
                    needsSave = true;
                }
            }
            
            // Save if any users were migrated
            if (needsSave) {
                const migratedData = Object.fromEntries(adminMap);
                fs.writeFileSync(ADMIN_USERS_FILE, JSON.stringify(migratedData, null, 2), 'utf8');
                console.log('[MIGRATION] Admin users migrated with default PINs');
            }
            
            return adminMap;
        }
    } catch (e) {
        console.error('[DATA] Failed to load admin users:', e.message);
    }
    // Return default admin if file doesn't exist
    return new Map([
        ['harywang', {
            username: 'harywang',
            nama: 'Hary Wang',
            email: 'admin@harywang.online',
            password: crypto.createHash('sha256').update('admin123').digest('hex'),
            pin: crypto.createHash('sha256').update('123456').digest('hex'), // Default PIN: 123456
            grade: 'SUPER_ADMIN',
            status: 'active',
            joinDate: new Date().toISOString()
        }]
    ]);
}

function saveAdminUsers() {
    try {
        const data = Object.fromEntries(ADMIN_USERS);
        fs.writeFileSync(ADMIN_USERS_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('[DATA] Admin users saved to file');
    } catch (e) {
        console.error('[DATA] Failed to save admin users:', e.message);
    }
}

function loadActivityLogs() {
    try {
        if (fs.existsSync(ACTIVITY_LOGS_FILE)) {
            return JSON.parse(fs.readFileSync(ACTIVITY_LOGS_FILE, 'utf8'));
        }
    } catch (e) {
        console.error('[DATA] Failed to load activity logs:', e.message);
    }
    return { admin: [], grades: [], users: [], whitelist: [], logs: [] };
}

function saveActivityLogs() {
    try {
        fs.writeFileSync(ACTIVITY_LOGS_FILE, JSON.stringify(ACTIVITY_LOGS, null, 2), 'utf8');
        console.log('[DATA] Activity logs saved to file');
    } catch (e) {
        console.error('[DATA] Failed to save activity logs:', e.message);
    }
}

function loadGradePermissions() {
    try {
        if (fs.existsSync(GRADE_PERMISSIONS_FILE)) {
            const data = JSON.parse(fs.readFileSync(GRADE_PERMISSIONS_FILE, 'utf8'));
            return new Map(Object.entries(data));
        }
    } catch (e) {
        console.error('[DATA] Failed to load grade permissions:', e.message);
    }
    // Return default grades
    return new Map([
        ['SUPER_ADMIN', {
            id: 'SUPER_ADMIN',
            name: 'Super Administrator',
            description: 'Full access to all features',
            permissions: {
                dashboard: { view: true, edit: true, delete: true },
                users: { view: true, edit: true, delete: true },
                whitelist: { view: true, edit: true, delete: true },
                logs: { view: true, edit: true, delete: true },
                admin: { view: true, edit: true, delete: true },
                grades: { view: true, edit: true, delete: true },
                settings: { view: true, edit: true, delete: true }
            }
        }],
        ['ADMIN', {
            id: 'ADMIN',
            name: 'Administrator',
            description: 'Can manage users and view logs',
            permissions: {
                dashboard: { view: true, edit: false, delete: false },
                users: { view: true, edit: true, delete: false },
                whitelist: { view: true, edit: true, delete: false },
                logs: { view: true, edit: false, delete: false },
                admin: { view: true, edit: false, delete: false },
                grades: { view: true, edit: false, delete: false },
                settings: { view: true, edit: false, delete: false }
            }
        }],
        ['MODERATOR', {
            id: 'MODERATOR',
            name: 'Moderator',
            description: 'Can view data and moderate content',
            permissions: {
                dashboard: { view: true, edit: false, delete: false },
                users: { view: true, edit: false, delete: false },
                whitelist: { view: true, edit: false, delete: false },
                logs: { view: true, edit: false, delete: false },
                admin: { view: false, edit: false, delete: false },
                grades: { view: false, edit: false, delete: false },
                settings: { view: false, edit: false, delete: false }
            }
        }],
        ['VIEWER', {
            id: 'VIEWER',
            name: 'Viewer',
            description: 'Read-only access to dashboard',
            permissions: {
                dashboard: { view: true, edit: false, delete: false },
                users: { view: false, edit: false, delete: false },
                whitelist: { view: false, edit: false, delete: false },
                logs: { view: false, edit: false, delete: false },
                admin: { view: false, edit: false, delete: false },
                grades: { view: false, edit: false, delete: false },
                settings: { view: false, edit: false, delete: false }
            }
        }]
    ]);
}

function saveGradePermissions() {
    try {
        const data = Object.fromEntries(GRADE_PERMISSIONS);
        fs.writeFileSync(GRADE_PERMISSIONS_FILE, JSON.stringify(data, null, 2), 'utf8');
        console.log('[DATA] Grade permissions saved to file');
    } catch (e) {
        console.error('[DATA] Failed to save grade permissions:', e.message);
    }
}

// IP Whitelist - IPs that can access master panel directly (Map: ip -> name)
const IP_WHITELIST = new Map([
    ['27.111.11.11', 'Default IP'],
    ['127.0.0.1', 'Localhost'],
    ['::1', 'Localhost IPv6'],
    ['localhost', 'Localhost']
]);

// Activity logs for whitelist changes
const WHITELIST_LOGS = [];

function addWhitelistLog(action, message, ip, name) {
    WHITELIST_LOGS.push({
        timestamp: new Date().toISOString(),
        action, // ADD, DELETE, UPDATE
        message,
        ip,
        name
    });
    
    // Keep only last 200 logs
    if (WHITELIST_LOGS.length > 200) {
        WHITELIST_LOGS.shift();
    }
    
    console.log(`[WHITELIST LOG] ${action}: ${message}`);
}

// Valid device tokens for non-whitelisted IPs (Map: token -> deviceName)
const DEVICE_TOKENS = new Map([
    ['HARY2026MASTER01', 'Default Master Token'],  // Default token
    ['HRW-ADMIN-2026-SPECIAL', 'Harywang Personal Access Token']  // Token khusus untuk Harywang
]);

// Registered Devices - devices that have been authorized once with a token
// Map: deviceFingerprint -> { deviceName, userAgent, ip, registeredAt, lastAccess }
const REGISTERED_DEVICES = new Map();

// Admin Users Management - Load from file with persistence
const ADMIN_USERS = loadAdminUsers();

// Grade Permissions - Load from file with persistence
const GRADE_PERMISSIONS = loadGradePermissions();

// In-memory activity logs storage - Load from file with persistence
const ACTIVITY_LOGS = loadActivityLogs();

// Helper function to add activity log with auto-save
function addActivityLog(section, username, action, details) {
    const log = {
        timestamp: new Date().toISOString(),
        username: username || 'System',
        action,
        details
    };
    
    if (ACTIVITY_LOGS[section]) {
        ACTIVITY_LOGS[section].unshift(log);
        // Keep only last 100 logs per section
        if (ACTIVITY_LOGS[section].length > 100) {
            ACTIVITY_LOGS[section] = ACTIVITY_LOGS[section].slice(0, 100);
        }
        // Auto-save to file
        saveActivityLogs();
    }
}

function generateDeviceToken() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let token = '';
    for (let i = 0; i < 16; i++) {
        token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
}

function generateDeviceFingerprint(req) {
    const userAgent = req.headers['user-agent'] || 'unknown';
    const acceptLanguage = req.headers['accept-language'] || 'unknown';
    const acceptEncoding = req.headers['accept-encoding'] || 'unknown';
    
    // Create a simple fingerprint from browser characteristics
    const fingerprint = crypto.createHash('sha256')
        .update(userAgent + acceptLanguage + acceptEncoding)
        .digest('hex');
    
    return fingerprint;
}

// Middleware to check IP whitelist or device token
function checkPanelAccess(req, res, next) {
    // Get IP (handle proxy headers)
    let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress || 
             req.connection.remoteAddress;

    // Normalize IPv6-mapped IPv4 addresses
    if (ip && ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    console.log('[MASTER PANEL] Access attempt from IP:', ip);

    // Check if IP is whitelisted
    if (IP_WHITELIST.has(ip)) {
        console.log('[MASTER PANEL] IP whitelisted - allowed');
        req.accessGranted = true;
        req.accessReason = 'whitelisted_ip';
        return next();
    }

    // Check if device is already registered
    const deviceFingerprint = generateDeviceFingerprint(req);
    if (REGISTERED_DEVICES.has(deviceFingerprint)) {
        const deviceInfo = REGISTERED_DEVICES.get(deviceFingerprint);
        deviceInfo.lastAccess = new Date().toISOString();
        deviceInfo.ip = ip; // Update current IP
        console.log('[MASTER PANEL] Registered device - allowed:', deviceInfo.deviceName);
        req.accessGranted = true;
        req.accessReason = 'registered_device';
        req.deviceFingerprint = deviceFingerprint;
        return next();
    }

    // Check device token
    const deviceToken = req.headers['x-device-token'] || req.query.token;
    if (deviceToken && DEVICE_TOKENS.has(deviceToken)) {
        console.log('[MASTER PANEL] Valid device token - allowed');
        req.accessGranted = true;
        req.accessReason = 'device_token';
        req.deviceToken = deviceToken;
        req.deviceFingerprint = deviceFingerprint;
        return next();
    }

    // Not whitelisted and no valid token
    console.log('[MASTER PANEL] BLOCKED - No whitelist/token/registered device');
    req.accessGranted = false;
    next();
}

// Middleware to check authentication (username/password)
function checkMasterAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
    const [username, password] = credentials.split(':');

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    if (username !== MASTER_PANEL_CREDENTIALS.username || 
        hashedPassword !== MASTER_PANEL_CREDENTIALS.password) {
        console.log('[MASTER PANEL] Invalid credentials');
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[MASTER PANEL] Authentication successful');
    req.user = { username };
    next();
}

// Middleware that accepts both master credentials OR admin user credentials
function checkMasterOrAdminAuth(req, res, next) {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    const credentials = Buffer.from(authHeader.substring(6), 'base64').toString();
    const [username, password] = credentials.split(':');
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    // Check if master panel credentials
    if (username === MASTER_PANEL_CREDENTIALS.username && 
        hashedPassword === MASTER_PANEL_CREDENTIALS.password) {
        req.user = { username, type: 'master' };
        return next();
    }

    // Check if admin user credentials
    const admin = ADMIN_USERS.get(username);
    if (admin && hashedPassword === admin.password) {
        if (admin.status === 'banned') {
            return res.status(403).json({ error: 'Account banned' });
        }
        req.user = { username, type: 'admin', grade: admin.grade };
        return next();
    }

    return res.status(401).json({ error: 'Invalid credentials' });
}

// Log master panel config on startup
console.log('\n========================================');
console.log('MASTER PANEL CONFIGURATION:');
console.log('Username:', MASTER_PANEL_CREDENTIALS.username);
console.log('Password: *** (hashed)');
console.log('\nIP WHITELIST:');
Array.from(IP_WHITELIST.entries()).forEach(([ip, name]) => {
    console.log(`  - ${ip} (${name})`);
});
console.log('Active Device Tokens:', DEVICE_TOKENS.size);
console.log('Registered Devices:', REGISTERED_DEVICES.size);
console.log('========================================\n');

// ============ MULTER ============

const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, STORAGE_DIR),
    filename: (req, file, cb) => cb(null, uuidv4() + path.extname(file.originalname))
});

const upload = multer({ storage, limits: { fileSize: MAX_FILE_SIZE } });

// ============ AUTH API (MEMBER SITE) ============

// Register endpoint
app.post('/api/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Semua field harus diisi' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }

    const users = loadUsers();
    
    // Check if username already exists
    if (users.find(u => u.username === username)) {
        return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    // Check if email already exists
    if (users.find(u => u.email === email)) {
        return res.status(400).json({ error: 'Email sudah digunakan' });
    }

    // Create new user
    const newUser = {
        username,
        email,
        password, // Store plain text (not recommended for production)
        createdAt: new Date().toISOString(),
        storageUsed: 0
    };

    users.push(newUser);
    saveUsers(users);

    // Generate JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' });

    console.log(`[REGISTER] New user registered: ${username}`);
    res.json({ token, username });
});

// Login endpoint
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password harus diisi' });
    }

    const users = loadUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
        return res.status(401).json({ error: 'Username atau password salah' });
    }

    // Generate JWT token
    const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '30d' });

    console.log(`[LOGIN] User logged in: ${username}`);
    res.json({ token, username });
});

// ============ FOLDER API ============

app.post('/api/folder', verifyToken, (req, res) => {
    const { name, parentId } = req.body;
    const username = req.user.username;
    
    if (!name || !name.trim()) {
        return res.status(400).json({ error: 'Nama folder wajib diisi' });
    }

    // If creating inside another folder, verify parent ownership
    if (parentId) {
        const meta = loadMeta();
        const parent = meta.folders.find(f => f.id === parentId);
        if (!parent) {
            return res.status(404).json({ error: 'Folder parent tidak ditemukan' });
        }
        // Check ownership (unless master user)
        if (username !== 'harywang' && parent.owner !== username) {
            return res.status(403).json({ error: 'Tidak ada akses ke folder parent' });
        }
    }

    const meta = loadMeta();
    const folder = {
        id: uuidv4(),
        name: name.trim(),
        parentId: parentId || null,
        owner: username,
        createdAt: new Date().toISOString()
    };

    meta.folders.push(folder);
    saveMeta(meta);

    res.json({ success: true, folder });
});

app.delete('/api/folder/:id', verifyToken, (req, res) => {
    const meta = loadMeta();
    const folderId = req.params.id;
    const username = req.user.username;
    
    const folder = meta.folders.find(f => f.id === folderId);
    if (!folder) return res.status(404).json({ error: 'Folder tidak ditemukan' });

    // Check ownership (master can delete anything)
    if (username !== 'harywang' && folder.owner !== username) {
        return res.status(403).json({ error: 'Tidak ada akses' });
    }

    function getChildIds(parentId) {
        const children = meta.folders.filter(f => f.parentId === parentId);
        let ids = [parentId];
        children.forEach(c => { ids = ids.concat(getChildIds(c.id)); });
        return ids;
    }

    const allIds = getChildIds(folderId);

    // Delete all files in folder and subfolders
    meta.files = meta.files.filter(f => {
        if (allIds.includes(f.folderId)) {
            const filePath = path.join(STORAGE_DIR, f.filename);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
            return false;
        }
        return true;
    });

    // Delete folders
    meta.folders = meta.folders.filter(f => !allIds.includes(f.id));
    saveMeta(meta);

    res.json({ success: true });
});

// ============ FILE API ============

app.post('/api/upload', verifyToken, (req, res) => {
    const username = req.user.username;
    const totalUsed = getTotalUsed(username);

    upload.single('file')(req, res, (err) => {
        if (err) {
            if (err.code === 'LIMIT_FILE_SIZE') return res.status(413).json({ error: 'File terlalu besar (maks 500MB)' });
            return res.status(500).json({ error: err.message });
        }
        if (!req.file) return res.status(400).json({ error: 'Tidak ada file' });

        if (totalUsed + req.file.size > MAX_STORAGE) {
            fs.unlinkSync(req.file.path);
            return res.status(507).json({ error: 'Storage penuh (maks 20GB)' });
        }

        const folderId = req.body.folderId || null;
        
        // Verify folder ownership if uploading to a folder
        if (folderId) {
            const meta = loadMeta();
            const folder = meta.folders.find(f => f.id === folderId);
            if (!folder) {
                fs.unlinkSync(req.file.path);
                return res.status(404).json({ error: 'Folder tidak ditemukan' });
            }
            if (username !== 'harywang' && folder.owner !== username) {
                fs.unlinkSync(req.file.path);
                return res.status(403).json({ error: 'Tidak ada akses ke folder ini' });
            }
        }

        const meta = loadMeta();
        const fileInfo = {
            id: path.parse(req.file.filename).name,
            originalName: req.file.originalname,
            filename: req.file.filename,
            size: req.file.size,
            mimetype: req.file.mimetype,
            folderId: folderId,
            owner: username,
            uploadedAt: new Date().toISOString()
        };

        meta.files.push(fileInfo);
        saveMeta(meta);
        res.json({ success: true, file: fileInfo });
    });
});

app.get('/api/files', verifyToken, (req, res) => {
    const meta = loadMeta();
    const username = req.user.username;
    const folderId = req.query.folder || null;

    // Verify folder ownership if browsing specific folder
    if (folderId) {
        const folder = meta.folders.find(f => f.id === folderId);
        if (!folder) {
            return res.status(404).json({ error: 'Folder tidak ditemukan' });
        }
        if (username !== 'harywang' && folder.owner !== username) {
            return res.status(403).json({ error: 'Tidak ada akses' });
        }
    }

    // Filter based on ownership
    let files, folders;
    if (username === 'harywang') {
        // Master sees all
        files = meta.files.filter(f => (f.folderId || null) === folderId);
        folders = meta.folders.filter(f => (f.parentId || null) === folderId);
    } else {
        // Regular user sees only their own
        files = meta.files.filter(f => (f.folderId || null) === folderId && f.owner === username);
        folders = meta.folders.filter(f => (f.parentId || null) === folderId && f.owner === username);
    }

    res.json({ 
        files, 
        folders: folders.map(f => ({ 
            id: f.id, 
            name: f.name, 
            parentId: f.parentId, 
            owner: f.owner,
            createdAt: f.createdAt 
        }))
    });
});

app.get('/api/storage', verifyToken, (req, res) => {
    const username = req.user.username;
    const meta = loadMeta();
    
    let used, fileCount, folderCount;
    if (username === 'harywang') {
        used = meta.files.reduce((sum, f) => sum + f.size, 0);
        fileCount = meta.files.length;
        folderCount = meta.folders.length;
    } else {
        const userFiles = meta.files.filter(f => f.owner === username);
        used = userFiles.reduce((sum, f) => sum + f.size, 0);
        fileCount = userFiles.length;
        folderCount = meta.folders.filter(f => f.owner === username).length;
    }

    res.json({
        used,
        total: MAX_STORAGE,
        available: MAX_STORAGE - used,
        fileCount,
        folderCount
    });
});

app.get('/api/download/:id', verifyToken, (req, res) => {
    const meta = loadMeta();
    const username = req.user.username;
    const file = meta.files.find(f => f.id === req.params.id);
    
    if (!file) return res.status(404).json({ error: 'File tidak ditemukan' });

    // Check ownership (master can download anything)
    if (username !== 'harywang' && file.owner !== username) {
        return res.status(403).json({ error: 'Tidak ada akses' });
    }

    const filePath = path.join(STORAGE_DIR, file.filename);
    if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'File hilang dari storage' });

    res.download(filePath, file.originalName);
});

app.delete('/api/delete/:id', verifyToken, (req, res) => {
    const meta = loadMeta();
    const username = req.user.username;
    const idx = meta.files.findIndex(f => f.id === req.params.id);
    
    if (idx === -1) return res.status(404).json({ error: 'File tidak ditemukan' });

    const file = meta.files[idx];

    // Check ownership (master can delete anything)
    if (username !== 'harywang' && file.owner !== username) {
        return res.status(403).json({ error: 'Tidak ada akses' });
    }

    const filePath = path.join(STORAGE_DIR, file.filename);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    meta.files.splice(idx, 1);
    saveMeta(meta);
    res.json({ success: true });
});

app.get('/api/folder-path/:id', verifyToken, (req, res) => {
    const meta = loadMeta();
    const pathArr = [];
    let current = req.params.id;

    while (current) {
        const folder = meta.folders.find(f => f.id === current);
        if (!folder) break;
        pathArr.unshift({ id: folder.id, name: folder.name });
        current = folder.parentId;
    }

    res.json({ path: pathArr });
});

// ============ MASTER PANEL API ============

// Check access (IP whitelist or device token)
app.post('/api/adminarea/master/check-access', (req, res) => {
    const { token } = req.body;
    
    // Get IP
    let ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.headers['x-real-ip'] || 
             req.socket.remoteAddress || 
             req.connection.remoteAddress;
    
    if (ip && ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    // Check IP whitelist
    if (IP_WHITELIST.has(ip)) {
        return res.json({ accessGranted: true, reason: 'whitelisted_ip' });
    }

    // Check device token
    if (token && DEVICE_TOKENS.has(token)) {
        return res.json({ accessGranted: true, reason: 'valid_token' });
    }

    res.json({ accessGranted: false, ip });
});

// Login to master panel (master admin)
app.post('/api/adminarea/master/login', checkPanelAccess, (req, res) => {
    if (!req.accessGranted) {
        return res.status(403).json({ error: 'Access denied - IP not whitelisted' });
    }

    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');

    if (username !== MASTER_PANEL_CREDENTIALS.username || 
        hashedPassword !== MASTER_PANEL_CREDENTIALS.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // If logged in via device token, register this device
    if (req.accessReason === 'device_token' && req.deviceFingerprint && req.deviceToken) {
        const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                   req.headers['x-real-ip'] || 
                   req.socket.remoteAddress || 
                   req.connection.remoteAddress;
        
        const deviceName = DEVICE_TOKENS.get(req.deviceToken) || 'Unknown Device';
        const userAgent = req.headers['user-agent'] || 'Unknown';
        
        REGISTERED_DEVICES.set(req.deviceFingerprint, {
            deviceName,
            userAgent,
            ip: ip?.replace('::ffff:', ''),
            registeredAt: new Date().toISOString(),
            lastAccess: new Date().toISOString(),
            tokenUsed: req.deviceToken
        });
        
        console.log(`[MASTER PANEL] Device registered: ${deviceName} (${req.deviceFingerprint.substring(0, 8)}...)`);
        addWhitelistLog('DEVICE_REGISTER', `Device "${deviceName}" terdaftar dari IP ${ip}`, ip, deviceName);
    }

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    res.json({ 
        success: true, 
        sessionToken, 
        username,
        accessReason: req.accessReason,
        deviceRegistered: req.accessReason === 'device_token'
    });
});

// Login as admin user (untuk PIN verification flow)
app.post('/api/adminarea/master/admin-login', checkPanelAccess, (req, res) => {
    if (!req.accessGranted) {
        return res.status(403).json({ error: 'Access denied - IP not whitelisted' });
    }

    const { username, password } = req.body;
    
    if (!username || !password) {
        return res.status(400).json({ error: 'Username and password required' });
    }

    // Check if admin user exists
    const admin = ADMIN_USERS.get(username);
    if (!admin) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if admin is banned
    if (admin.status === 'banned') {
        return res.status(403).json({ 
            error: 'Akun diblokir. Hubungi Harywang untuk unlock.',
            banned: true
        });
    }

    // Verify password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    if (hashedPassword !== admin.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Success - return basic info, PIN verification will happen next
    console.log(`[ADMIN LOGIN] Admin user ${username} logged in successfully`);
    
    res.json({ 
        success: true,
        username: admin.username,
        fullName: admin.fullName,
        requiresPin: true
    });
});

// Get IP whitelist (requires auth)
// Get IP whitelist (requires auth)
app.get('/api/adminarea/master/whitelist', checkMasterOrAdminAuth, (req, res) => {
    const whitelist = Array.from(IP_WHITELIST.entries()).map(([ip, name]) => ({
        ip,
        name,
        active: true,
        addedAt: new Date().toISOString()
    }));
    res.json({ whitelist });
});

// Add IP to whitelist (requires auth)
app.post('/api/adminarea/master/whitelist/add', checkMasterOrAdminAuth, (req, res) => {
    const { ip, name } = req.body;
    if (!ip) {
        return res.status(400).json({ error: 'IP required' });
    }
    if (!name) {
        return res.status(400).json({ error: 'Name required' });
    }
    
    if (IP_WHITELIST.has(ip)) {
        return res.status(400).json({ error: 'IP sudah ada dalam whitelist' });
    }
    
    IP_WHITELIST.set(ip, name);
    addWhitelistLog('ADD', `IP ${ip} (${name}) ditambahkan ke whitelist`, ip, name);
    console.log(`[MASTER PANEL] IP added to whitelist: ${ip} (${name})`);
    res.json({ success: true, message: `IP ${ip} added to whitelist` });
});

// Delete IP from whitelist (requires auth)
app.delete('/api/adminarea/master/whitelist/:ip', checkMasterOrAdminAuth, (req, res) => {
    const { ip } = req.params;
    if (!ip) {
        return res.status(400).json({ error: 'IP required' });
    }
    // Don't allow deleting localhost
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
        return res.status(400).json({ error: 'Cannot delete localhost from whitelist' });
    }
    
    const name = IP_WHITELIST.get(ip) || 'Unknown';
    IP_WHITELIST.delete(ip);
    addWhitelistLog('DELETE', `IP ${ip} (${name}) dihapus dari whitelist`, ip, name);
    console.log(`[MASTER PANEL] IP removed from whitelist: ${ip} (${name})`);
    res.json({ success: true, message: `IP ${ip} removed from whitelist` });
});

// Get whitelist activity logs (requires auth)
app.get('/api/adminarea/master/whitelist/logs', checkMasterOrAdminAuth, (req, res) => {
    res.json({ logs: WHITELIST_LOGS });
});

// Get all registered devices (requires auth)
app.get('/api/adminarea/master/devices', checkMasterOrAdminAuth, (req, res) => {
    const devices = Array.from(REGISTERED_DEVICES.entries()).map(([fingerprint, info]) => ({
        fingerprint: fingerprint.substring(0, 16) + '...', // Show partial fingerprint
        deviceName: info.deviceName,
        userAgent: info.userAgent,
        ip: info.ip,
        registeredAt: info.registeredAt,
        lastAccess: info.lastAccess,
        tokenUsed: info.tokenUsed
    }));
    res.json({ devices });
});

// Delete registered device (requires auth)
app.delete('/api/adminarea/master/devices/:fingerprint', checkMasterOrAdminAuth, (req, res) => {
    const { fingerprint } = req.params;
    
    // Find device by partial fingerprint match
    let fullFingerprint = null;
    for (const [fp, info] of REGISTERED_DEVICES.entries()) {
        if (fp.startsWith(fingerprint.replace('...', ''))) {
            fullFingerprint = fp;
            break;
        }
    }
    
    if (!fullFingerprint) {
        return res.status(404).json({ error: 'Device not found' });
    }
    
    const deviceInfo = REGISTERED_DEVICES.get(fullFingerprint);
    REGISTERED_DEVICES.delete(fullFingerprint);
    addWhitelistLog('DEVICE_REMOVE', `Device "${deviceInfo.deviceName}" dihapus dari registered devices`, deviceInfo.ip, deviceInfo.deviceName);
    console.log(`[MASTER PANEL] Registered device removed: ${deviceInfo.deviceName}`);
    res.json({ success: true, message: 'Device unregistered' });
});

// Get all device tokens (requires auth)
app.get('/api/adminarea/master/tokens', checkMasterOrAdminAuth, (req, res) => {
    const tokens = Array.from(DEVICE_TOKENS.entries()).map(([token, deviceName]) => ({
        token,
        deviceName,
        active: true,
        createdAt: new Date().toISOString()
    }));
    res.json({ tokens });
});

// Add device token (requires auth)
app.post('/api/adminarea/master/tokens/add', checkMasterOrAdminAuth, (req, res) => {
    const { token, deviceName } = req.body;
    let newToken = token;
    
    // If no token provided, generate one
    if (!newToken) {
        newToken = generateDeviceToken();
    }
    
    // Validate token format (16 alphanumeric chars)
    if (!/^[A-Z0-9]{16}$/.test(newToken)) {
        return res.status(400).json({ error: 'Token harus 16 karakter alphanumeric (A-Z, 0-9)' });
    }
    
    // Check if token already exists
    if (DEVICE_TOKENS.has(newToken)) {
        return res.status(400).json({ error: 'Token sudah ada, silakan generate ulang' });
    }
    
    DEVICE_TOKENS.set(newToken, deviceName || 'Unknown Device');
    console.log(`[MASTER PANEL] Token added: ${newToken} for ${deviceName}`);
    res.json({ success: true, token: newToken, message: `Token ${newToken} added` });
});

// Delete device token (requires auth)
app.delete('/api/adminarea/master/tokens/:token', checkMasterOrAdminAuth, (req, res) => {
    const { token } = req.params;
    if (!token) {
        return res.status(400).json({ error: 'Token required' });
    }
    DEVICE_TOKENS.delete(token);
    console.log(`[MASTER PANEL] Token deleted: ${token}`);
    res.json({ success: true, message: `Token ${token} removed` });
});

// ==================== ADMIN USERS API ====================

// Get all admin users (requires auth)
app.get('/api/adminarea/master/admin-users', checkMasterOrAdminAuth, (req, res) => {
    const admins = Array.from(ADMIN_USERS.values()).map(admin => ({
        username: admin.username,
        nama: admin.nama,
        email: admin.email,
        grade: admin.grade,
        status: admin.status,
        joinDate: admin.joinDate
        // Don't send password hash to frontend
    }));
    res.json({ admins });
});

// Get single admin user (requires auth)
app.get('/api/adminarea/master/admin-users/:username', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    const admin = ADMIN_USERS.get(username);
    
    if (!admin) {
        return res.status(404).json({ error: 'Admin user not found' });
    }
    
    res.json({ 
        admin: {
            username: admin.username,
            nama: admin.nama,
            email: admin.email,
            grade: admin.grade,
            status: admin.status,
            joinDate: admin.joinDate
        }
    });
});

// Add new admin user (requires auth)
app.post('/api/adminarea/master/admin-users', checkMasterOrAdminAuth, (req, res) => {
    const { username, nama, email, password, grade, status } = req.body;
    
    if (!username || !nama || !email || !password || !grade) {
        return res.status(400).json({ error: 'Semua field harus diisi' });
    }
    
    if (ADMIN_USERS.has(username)) {
        return res.status(400).json({ error: 'Username sudah digunakan' });
    }
    
    if (!GRADE_PERMISSIONS.has(grade)) {
        return res.status(400).json({ error: 'Grade permission tidak valid' });
    }
    
    // Hash password
    const hashedPassword = crypto.createHash('sha256').update(password).digest('hex');
    
    // Default PIN: 123456 for new admins
    const defaultPin = crypto.createHash('sha256').update('123456').digest('hex');
    
    ADMIN_USERS.set(username, {
        username,
        nama,
        email,
        password: hashedPassword,
        pin: defaultPin,
        grade,
        status: status || 'active',
        joinDate: new Date().toISOString()
    });
    
    saveAdminUsers(); // Auto-save to file
    
    console.log(`[MASTER PANEL] Admin user added: ${username} (${nama}) - Grade: ${grade}`);
    
    // Log activity
    addActivityLog('admin', req.masterCredentials?.username || 'admin', 'ADD_ADMIN', `Added admin user: ${username} (${nama}) with grade ${grade}`);
    
    res.json({ success: true, message: `Admin user ${username} berhasil ditambahkan` });
});

// Get single admin user (requires auth)
app.get('/api/adminarea/master/admin-users/:username', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    
    const admin = ADMIN_USERS.get(username);
    if (!admin) {
        return res.status(404).json({ error: 'Admin user not found' });
    }
    
    // Don't send password
    const { password, ...adminData } = admin;
    res.json({ admin: adminData });
});

// Update admin user (requires auth)
app.put('/api/adminarea/master/admin-users/:username', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    const { nama, email, password, grade, status } = req.body;
    
    const admin = ADMIN_USERS.get(username);
    if (!admin) {
        return res.status(404).json({ error: 'Admin user not found' });
    }
    
    if (grade && !GRADE_PERMISSIONS.has(grade)) {
        return res.status(400).json({ error: 'Grade permission tidak valid' });
    }
    
    // Track changes for detailed logging
    const changes = [];
    const oldData = { nama: admin.nama, email: admin.email, grade: admin.grade, status: admin.status };
    
    // Update fields and track changes
    if (nama && nama !== admin.nama) {
        changes.push(`Nama: "${admin.nama}" → "${nama}"`);
        admin.nama = nama;
    }
    if (email && email !== admin.email) {
        changes.push(`Email: "${admin.email}" → "${email}"`);
        admin.email = email;
    }
    if (grade && grade !== admin.grade) {
        changes.push(`Grade: "${admin.grade}" → "${grade}"`);
        admin.grade = grade;
    }
    if (status && status !== admin.status) {
        changes.push(`Status: "${admin.status}" → "${status}"`);
        admin.status = status;
    }
    if (password && password.trim().length > 0) {
        changes.push('Password diubah');
        admin.password = crypto.createHash('sha256').update(password).digest('hex');
    }
    
    ADMIN_USERS.set(username, admin);
    
    saveAdminUsers(); // Auto-save to file
    
    console.log(`[MASTER PANEL] Admin user updated: ${username}`);
    
    // Log activity with detailed changes
    const changeDetails = changes.length > 0 ? changes.join(', ') : 'No changes';
    addActivityLog('admin', req.masterCredentials?.username || 'admin', 'UPDATE_ADMIN', `Updated admin "${username}": ${changeDetails}`);
    
    res.json({ success: true, message: `Admin user ${username} berhasil diupdate` });
});

// Delete admin user (requires auth)
app.delete('/api/adminarea/master/admin-users/:username', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    
    // Prevent deleting the master admin
    if (username === 'harywang') {
        return res.status(400).json({ error: 'Tidak dapat menghapus master admin' });
    }
    
    const admin = ADMIN_USERS.get(username);
    if (!admin) {
        return res.status(404).json({ error: 'Admin user not found' });
    }
    
    ADMIN_USERS.delete(username);
    
    saveAdminUsers(); // Auto-save to file
    
    console.log(`[MASTER PANEL] Admin user deleted: ${username}`);
    
    // Log activity
    addActivityLog('admin', req.masterCredentials?.username || 'admin', 'DELETE_ADMIN', `Deleted admin user: ${username} (${admin.nama})`);
    
    res.json({ success: true, message: `Admin user ${username} berhasil dihapus` });
});

// Reset admin password (requires auth)
app.post('/api/adminarea/master/admin-users/:username/reset-password', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    const { newPassword } = req.body;
    
    const admin = ADMIN_USERS.get(username);
    if (!admin) {
        return res.status(404).json({ error: 'Admin user not found' });
    }
    
    if (!newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'Password minimal 6 karakter' });
    }
    
    // Update password
    admin.password = crypto.createHash('sha256').update(newPassword).digest('hex');
    ADMIN_USERS.set(username, admin);
    
    saveAdminUsers(); // Auto-save to file
    
    console.log(`[MASTER PANEL] Password reset for admin: ${username}`);
    
    // Log activity
    addActivityLog('admin', req.masterCredentials?.username || 'admin', 'RESET_PASSWORD', `Reset password for admin: ${username} (${admin.nama})`);
    
    res.json({ success: true, message: `Password untuk ${username} berhasil direset` });
});

// PIN attempt tracking (in-memory, resets on server restart)
const PIN_ATTEMPTS = new Map(); // username -> { count: number, lastAttempt: timestamp }

// Verify admin PIN (requires valid admin credentials in Authorization header)
app.post('/api/adminarea/master/admin-users/:username/verify-pin', (req, res) => {
    const { username } = req.params;
    const { pin } = req.body;
    
    // Extract and validate credentials from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Basic ')) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    // Decode Basic Auth
    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [authUsername, authPassword] = credentials.split(':');

    // Verify the authenticated user matches the username in the URL
    if (authUsername !== username) {
        return res.status(403).json({ error: 'Cannot verify PIN for different user' });
    }

    const admin = ADMIN_USERS.get(username);
    if (!admin) {
        return res.status(404).json({ error: 'Admin user not found' });
    }

    // Verify password matches
    const hashedPassword = crypto.createHash('sha256').update(authPassword).digest('hex');
    if (hashedPassword !== admin.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    
    // Check if already banned
    if (admin.status === 'banned') {
        return res.status(403).json({ 
            error: 'Akun Anda telah di-BANNED. Hubungi Harywang untuk unlock.',
            banned: true 
        });
    }
    
    if (!pin || pin.length !== 6) {
        return res.status(400).json({ error: 'PIN harus 6 digit' });
    }
    
    // Hash PIN and compare
    const hashedPin = crypto.createHash('sha256').update(pin).digest('hex');
    
    // Check if admin has PIN set - if not, allow access (backward compatibility)
    if (!admin.pin) {
        console.log(`[AUTH] Admin ${username} has no PIN set, allowing access`);
        return res.json({ message: 'PIN verification skipped (no PIN set)', verified: true });
    }
    
    if (admin.pin !== hashedPin) {
        // Track failed attempts
        const attempts = PIN_ATTEMPTS.get(username) || { count: 0, lastAttempt: null };
        attempts.count++;
        attempts.lastAttempt = new Date().toISOString();
        PIN_ATTEMPTS.set(username, attempts);
        
        // Log failed attempt
        addActivityLog('admin', username, 'VERIFY_PIN_FAILED', `Failed PIN verification (attempt ${attempts.count}/5) for admin: ${username}`);
        
        // Check if should ban (5 failed attempts)
        if (attempts.count >= 5) {
            // Auto-ban user
            admin.status = 'banned';
            ADMIN_USERS.set(username, admin);
            saveAdminUsers();
            
            // Log ban
            addActivityLog('admin', 'SYSTEM', 'AUTO_BAN', `Admin "${username}" di-BANNED oleh SYSTEM karena 5x salah memasukkan PIN`);
            console.log(`[SECURITY] Admin ${username} BANNED - 5 failed PIN attempts`);
            
            // Reset attempts counter
            PIN_ATTEMPTS.delete(username);
            
            return res.status(403).json({ 
                error: 'Akun Anda telah di-BANNED karena 5x salah memasukkan PIN. Hubungi Harywang untuk unlock.', 
                banned: true,
                attempts: 5
            });
        }
        
        return res.status(401).json({ 
            error: 'PIN salah', 
            attemptsRemaining: 5 - attempts.count,
            attempts: attempts.count
        });
    }
    
    // PIN correct - reset attempts
    PIN_ATTEMPTS.delete(username);
    
    // Log success
    addActivityLog('admin', username, 'VERIFY_PIN_SUCCESS', `Successful PIN verification for admin: ${username}`);
    console.log(`[AUTH] PIN verified successfully for ${username}`);
    
    res.json({ success: true, verified: true, message: 'PIN verified successfully' });
});

// Check PIN status (has custom PIN or needs to set one)
app.get('/api/adminarea/master/admin-users/:username/pin-status', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    
    const admin = ADMIN_USERS.get(username);
    if (!admin) {
        return res.status(404).json({ error: 'Admin user not found' });
    }
    
    // Default PIN hash (123456)
    const defaultPinHash = crypto.createHash('sha256').update('123456').digest('hex');
    
    // Check if user has PIN and if it's custom (not default)
    const hasPin = !!admin.pin;
    const isDefaultPin = admin.pin === defaultPinHash;
    const hasCustomPin = hasPin && !isDefaultPin;
    
    res.json({ 
        hasPin, 
        hasCustomPin,
        needsSetPin: !hasCustomPin // User needs to set PIN if doesn't have custom PIN
    });
});

// Set PIN for first time (requires auth)
app.post('/api/adminarea/master/admin-users/:username/set-pin', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    const { newPin, confirmPin } = req.body;
    
    const admin = ADMIN_USERS.get(username);
    if (!admin) {
        return res.status(404).json({ error: 'Admin user not found' });
    }
    
    if (!newPin || newPin.length !== 6) {
        return res.status(400).json({ error: 'PIN harus 6 digit' });
    }
    
    if (!/^\d{6}$/.test(newPin)) {
        return res.status(400).json({ error: 'PIN harus berisi angka saja' });
    }
    
    if (newPin !== confirmPin) {
        return res.status(400).json({ error: 'Konfirmasi PIN tidak cocok' });
    }
    
    // Default PIN hash (123456)
    const defaultPinHash = crypto.createHash('sha256').update('123456').digest('hex');
    
    // Only allow setting PIN if user has default PIN or no PIN
    if (admin.pin && admin.pin !== defaultPinHash) {
        return res.status(400).json({ error: 'PIN sudah diatur. Gunakan fitur Ubah PIN.' });
    }
    
    // Set new PIN
    admin.pin = crypto.createHash('sha256').update(newPin).digest('hex');
    ADMIN_USERS.set(username, admin);
    saveAdminUsers();
    
    addActivityLog('admin', username, 'SET_PIN', `PIN pertama kali diatur untuk admin: ${username}`);
    
    res.json({ success: true, message: 'PIN berhasil diatur!' });
});

// Change admin PIN (requires auth)
app.post('/api/adminarea/master/admin-users/:username/change-pin', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    const { oldPin, newPin } = req.body;
    
    const admin = ADMIN_USERS.get(username);
    if (!admin) {
        return res.status(404).json({ error: 'Admin user not found' });
    }
    
    if (!newPin || newPin.length !== 6) {
        return res.status(400).json({ error: 'PIN harus 6 digit' });
    }
    
    if (!/^\d{6}$/.test(newPin)) {
        return res.status(400).json({ error: 'PIN harus berisi angka saja' });
    }
    
    // If admin has existing PIN, verify old PIN
    if (admin.pin && oldPin) {
        const hashedOldPin = crypto.createHash('sha256').update(oldPin).digest('hex');
        if (admin.pin !== hashedOldPin) {
            return res.status(401).json({ error: 'PIN lama salah' });
        }
    }
    
    // Update PIN
    admin.pin = crypto.createHash('sha256').update(newPin).digest('hex');
    ADMIN_USERS.set(username, admin);
    
    saveAdminUsers(); // Auto-save to file
    
    console.log(`[MASTER PANEL] PIN changed for admin: ${username}`);
    
    // Log activity
    addActivityLog('admin', req.masterCredentials?.username || 'admin', 'CHANGE_PIN', `Changed PIN for admin: ${username} (${admin.nama})`);
    
    res.json({ success: true, message: `PIN untuk ${username} berhasil diubah` });
});

// Get admin activity log (requires auth)
app.get('/api/adminarea/master/admin-users/:username/activity-log', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    
    const admin = ADMIN_USERS.get(username);
    if (!admin) {
        return res.status(404).json({ error: 'Admin user not found' });
    }
    
    // For now, return sample logs. Later can implement real activity tracking
    const sampleLogs = [
        {
            timestamp: new Date().toISOString(),
            action: 'LOGIN',
            message: 'User logged in successfully',
            ip: '27.111.11.11'
        },
        {
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            action: 'PASSWORD_RESET',
            message: 'Password was reset by administrator',
            ip: '27.111.11.11'
        },
        {
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            action: 'STATUS_CHANGE',
            message: `Status changed to ${admin.status}`,
            ip: '27.111.11.11'
        }
    ];
    
    res.json({ logs: sampleLogs });
});

// ==================== GRADE PERMISSIONS API ====================

// Get all grade permissions (requires auth)
app.get('/api/adminarea/master/grade-permissions', checkMasterOrAdminAuth, (req, res) => {
    const grades = Array.from(GRADE_PERMISSIONS.values());
    res.json({ grades });
});

// Add new grade permission (requires auth)
app.post('/api/adminarea/master/grade-permissions', checkMasterOrAdminAuth, (req, res) => {
    const { gradeId, name, description, permissions } = req.body;
    
    if (!gradeId || !name || !description || !permissions) {
        return res.status(400).json({ error: 'Semua field harus diisi' });
    }
    
    if (GRADE_PERMISSIONS.has(gradeId)) {
        return res.status(400).json({ error: 'Grade ID sudah digunakan' });
    }
    
    GRADE_PERMISSIONS.set(gradeId, {
        id: gradeId,
        name,
        description,
        permissions
    });
    
    saveGradePermissions(); // Auto-save to file
    
    console.log(`[MASTER PANEL] Grade permission added: ${gradeId} (${name})`);
    
    // Log activity
    addActivityLog('grades', req.masterCredentials?.username || 'admin', 'ADD_GRADE', `Added grade: ${gradeId} (${name})`);
    
    res.json({ success: true, message: `Grade ${name} berhasil ditambahkan` });
});

// Delete grade permission (requires auth)
app.delete('/api/adminarea/master/grade-permissions/:gradeId', checkMasterOrAdminAuth, (req, res) => {
    const { gradeId } = req.params;
    
    // Prevent deleting default grades if there are admins using them
    const adminsWithGrade = Array.from(ADMIN_USERS.values()).filter(a => a.grade === gradeId);
    if (adminsWithGrade.length > 0) {
        return res.status(400).json({ 
            error: `Tidak dapat menghapus grade ini karena masih digunakan oleh ${adminsWithGrade.length} admin` 
        });
    }
    
    const grade = GRADE_PERMISSIONS.get(gradeId);
    if (!grade) {
        return res.status(404).json({ error: 'Grade permission not found' });
    }
    
    GRADE_PERMISSIONS.delete(gradeId);
    
    saveGradePermissions(); // Auto-save to file
    
    console.log(`[MASTER PANEL] Grade permission deleted: ${gradeId}`);
    
    // Log activity
    addActivityLog('grades', req.masterCredentials?.username || 'admin', 'DELETE_GRADE', `Deleted grade: ${gradeId} (${grade.name})`);
    
    res.json({ success: true, message: `Grade ${grade.name} berhasil dihapus` });
});

// Update grade permission (requires auth)
app.put('/api/adminarea/master/grade-permissions/:gradeId', checkMasterOrAdminAuth, (req, res) => {
    const { gradeId } = req.params;
    const { name, description, permissions } = req.body;
    
    if (!name || !description || !permissions) {
        return res.status(400).json({ error: 'Name, description, dan permissions harus diisi' });
    }
    
    const grade = GRADE_PERMISSIONS.get(gradeId);
    if (!grade) {
        return res.status(404).json({ error: 'Grade permission not found' });
    }
    
    // Update grade
    GRADE_PERMISSIONS.set(gradeId, {
        id: gradeId,
        name,
        description,
        permissions
    });
    
    saveGradePermissions(); // Auto-save to file
    
    console.log(`[MASTER PANEL] Grade permission updated: ${gradeId} (${name})`);
    
    // Log activity
    addActivityLog('grades', req.masterCredentials?.username || 'admin', 'UPDATE_GRADE', `Updated grade: ${gradeId} (${name})`);
    
    res.json({ success: true, message: `Grade ${name} berhasil diupdate` });
});

// ==================== ACTIVITY LOGS API ====================

// Get activity logs by section (requires auth)
app.get('/api/adminarea/master/activity-logs', checkMasterOrAdminAuth, (req, res) => {
    const { section } = req.query;
    
    if (!section || !ACTIVITY_LOGS[section]) {
        return res.status(400).json({ error: 'Invalid section' });
    }
    
    res.json({ logs: ACTIVITY_LOGS[section] || [] });
});

// Get all users (requires auth)
app.get('/api/adminarea/master/users', checkMasterOrAdminAuth, (req, res) => {
    const users = loadUsers();
    const meta = loadMeta();
    
    const usersWithStats = users.map(user => {
        const userFiles = meta.files.filter(f => f.owner === user.username);
        const userFolders = meta.folders.filter(f => f.owner === user.username);
        const storage = userFiles.reduce((sum, f) => sum + f.size, 0);
        
        // Format date
        let registeredDate = 'N/A';
        if (user.createdAt) {
            const date = new Date(user.createdAt);
            registeredDate = date.toLocaleDateString('id-ID', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
        
        return {
            username: user.username,
            email: user.email || 'N/A',
            registeredAt: registeredDate,
            fileCount: userFiles.length,
            folderCount: userFolders.length,
            storageUsed: storage
        };
    });

    res.json({ users: usersWithStats });
});

// Get user password (for admin viewing)
app.get('/api/adminarea/master/users/:username/password', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    const users = loadUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
        return res.status(404).json({ error: 'User not found' });
    }
    
    // Return plain text password (already stored in plain text in users.json)
    res.json({ 
        username: user.username,
        password: user.password 
    });
});

// Reset user password
app.post('/api/adminarea/master/reset-password', checkMasterOrAdminAuth, (req, res) => {
    const { username, newPassword } = req.body;
    
    if (!username || !newPassword) {
        return res.status(400).json({ error: 'Username dan password baru wajib diisi' });
    }

    const users = loadUsers();
    const user = users.find(u => u.username === username);
    
    if (!user) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
    }

    // Hash new password
    user.password = crypto.createHash('sha256').update(newPassword).digest('hex');
    saveUsers(users);

    res.json({ success: true, message: `Password untuk ${username} berhasil direset` });
});

// Delete user and all their data
app.delete('/api/adminarea/master/user/:username', checkMasterOrAdminAuth, (req, res) => {
    const { username } = req.params;
    
    if (username === 'harywang') {
        return res.status(400).json({ error: 'Cannot delete master user' });
    }

    // Delete user from users.json
    let users = loadUsers();
    const userIndex = users.findIndex(u => u.username === username);
    if (userIndex === -1) {
        return res.status(404).json({ error: 'User tidak ditemukan' });
    }
    users.splice(userIndex, 1);
    saveUsers(users);

    // Delete all user's files and folders
    const meta = loadMeta();
    
    // Delete physical files
    meta.files.filter(f => f.owner === username).forEach(file => {
        const filePath = path.join(STORAGE_DIR, file.filename);
        if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    });

    // Remove from metadata
    meta.files = meta.files.filter(f => f.owner !== username);
    meta.folders = meta.folders.filter(f => f.owner !== username);
    saveMeta(meta);

    res.json({ success: true, message: `User ${username} dan semua datanya berhasil dihapus` });
});

// ============ MASTER PASSWORD CHANGE API ============

app.post('/api/adminarea/master/change-password', checkMasterOrAdminAuth, (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
        return res.status(400).json({ error: 'Old password dan new password harus diisi' });
    }

    if (newPassword.length < 8) {
        return res.status(400).json({ error: 'Password baru minimal 8 karakter' });
    }

    // Verify old password
    const oldHashedPassword = crypto.createHash('sha256').update(oldPassword).digest('hex');
    if (oldHashedPassword !== MASTER_PANEL_CREDENTIALS.password) {
        return res.status(401).json({ error: 'Password lama tidak cocok' });
    }

    // Update password
    const newHashedPassword = crypto.createHash('sha256').update(newPassword).digest('hex');
    MASTER_PANEL_CREDENTIALS.password = newHashedPassword;
    
    // Save to file
    saveMasterCredentials(MASTER_PANEL_CREDENTIALS);

    console.log('[MASTER PANEL] Password changed successfully');
    res.json({ success: true, message: 'Password berhasil diubah' });
});

// Get dashboard statistics
app.get('/api/adminarea/master/stats', checkMasterOrAdminAuth, (req, res) => {
    const users = loadUsers();
    const meta = loadMeta();
    
    const totalStorage = meta.files.reduce((sum, f) => sum + f.size, 0);
    
    res.json({
        totalUsers: users.length,
        totalFiles: meta.files.length,
        totalFolders: meta.folders.length,
        totalStorage,
        maxStorage: MAX_STORAGE,
        storagePercentage: ((totalStorage / MAX_STORAGE) * 100).toFixed(2)
    });
});

app.get('/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
});

// Serve master panel login page
app.get('/adminarea/master-login', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'masterpanel-new.html'));
});

// Serve master panel dashboard
app.get('/adminarea/master', (req, res) => {
    res.sendFile(path.join(__dirname, 'frontend', 'masterpanel.html'));
});

app.listen(PORT, () => {
    console.log(`HarywangCloud running on port ${PORT}`);
    console.log(`[MASTER PANEL] Admin Users: ${ADMIN_USERS.size}, Grade Permissions: ${GRADE_PERMISSIONS.size}, Registered Devices: ${REGISTERED_DEVICES.size}`);
});
