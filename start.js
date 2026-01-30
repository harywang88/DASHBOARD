const { spawn } = require('child_process');
const path = require('path');

const isWindows = process.platform === 'win32';
const npmCmd = isWindows ? 'npm.cmd' : 'npm';
const nodeCmd = isWindows ? 'node.exe' : 'node';

// Warna untuk console
const colors = {
    reset: '\x1b[0m',
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    magenta: '\x1b[35m',
    red: '\x1b[31m'
};

function log(service, message, color = colors.reset) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`${color}[${timestamp}] [${service}]${colors.reset} ${message}`);
}

console.log(`
${colors.cyan}=========================================
   Harywang Dashboard - Starting Services
=========================================${colors.reset}
`);

// Start Convert Service
const convertProcess = spawn(nodeCmd, ['server.js'], {
    cwd: path.join(__dirname, 'services', 'convert'),
    env: { ...process.env, PORT: '3001' },
    stdio: ['pipe', 'pipe', 'pipe']
});

convertProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
        if (line.trim()) log('CONVERT', line, colors.cyan);
    });
});

convertProcess.stderr.on('data', (data) => {
    log('CONVERT', data.toString().trim(), colors.red);
});

convertProcess.on('error', (err) => {
    log('CONVERT', `Failed to start: ${err.message}`, colors.red);
});

// Start PDF Service
const pdfProcess = spawn(nodeCmd, ['server.js'], {
    cwd: path.join(__dirname, 'services', 'pdf', 'backend'),
    env: { ...process.env, PORT: '3002' },
    stdio: ['pipe', 'pipe', 'pipe']
});

pdfProcess.stdout.on('data', (data) => {
    const lines = data.toString().trim().split('\n');
    lines.forEach(line => {
        if (line.trim()) log('PDF', line, colors.magenta);
    });
});

pdfProcess.stderr.on('data', (data) => {
    log('PDF', data.toString().trim(), colors.red);
});

pdfProcess.on('error', (err) => {
    log('PDF', `Failed to start: ${err.message}`, colors.red);
});

// Dashboard port - hardcoded to avoid system env conflicts
const DASHBOARD_PORT = 80;
let dashboardProcessRef = null;

// Wait for services to start then start main dashboard
setTimeout(() => {
    // Create clean env without existing PORT
    const cleanEnv = { ...process.env };
    cleanEnv.PORT = String(DASHBOARD_PORT);

    dashboardProcessRef = spawn(nodeCmd, ['server.js'], {
        cwd: __dirname,
        env: cleanEnv,
        stdio: ['pipe', 'pipe', 'pipe']
    });

    dashboardProcessRef.stdout.on('data', (data) => {
        const lines = data.toString().trim().split('\n');
        lines.forEach(line => {
            if (line.trim()) log('DASHBOARD', line, colors.green);
        });
    });

    dashboardProcessRef.stderr.on('data', (data) => {
        log('DASHBOARD', data.toString().trim(), colors.red);
    });

    dashboardProcessRef.on('error', (err) => {
        log('DASHBOARD', `Failed to start: ${err.message}`, colors.red);
    });

    console.log(`
${colors.green}=========================================
   All Services Started!
=========================================

   Dashboard:  http://localhost:${DASHBOARD_PORT}
   Convert:    http://localhost:3001
   PDF:        http://localhost:3002

   Domain:     https://harywang.online
=========================================${colors.reset}
`);
}, 2000);

// Handle process termination
process.on('SIGINT', () => {
    console.log('\n\nShutting down services...');
    convertProcess.kill();
    pdfProcess.kill();
    if (dashboardProcessRef) dashboardProcessRef.kill();
    process.exit(0);
});

process.on('SIGTERM', () => {
    console.log('\n\nShutting down services...');
    convertProcess.kill();
    pdfProcess.kill();
    if (dashboardProcessRef) dashboardProcessRef.kill();
    process.exit(0);
});
