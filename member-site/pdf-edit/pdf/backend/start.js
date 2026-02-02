#!/usr/bin/env node

/**
 * PDF House Startup Script
 * Simple one-command startup
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const http = require('http');

const backendDir = __dirname;
const PORT = 3000;

console.log(`
╔════════════════════════════════════════╗
║      🚀 PDF HOUSE - Startup Menu       ║
╚════════════════════════════════════════╝
`);

const menu = `
1️⃣  Start Server
2️⃣  Start Server + CLI
3️⃣  Start Server + Monitoring
4️⃣  Run Tests & Validation
5️⃣  Check Health Status
6️⃣  View Complete Guide
0️⃣  Exit

`;

console.log(menu);

const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.question('Select option (0-6): ', (answer) => {
    rl.close();
    
    switch(answer) {
        case '1':
            startServer();
            break;
        case '2':
            startServerWithCLI();
            break;
        case '3':
            startServerWithMonitoring();
            break;
        case '4':
            runTests();
            break;
        case '5':
            checkHealth();
            break;
        case '6':
            viewGuide();
            break;
        case '0':
            console.log('\n👋 Goodbye!');
            process.exit(0);
        default:
            console.log('\n❌ Invalid option');
            process.exit(1);
    }
});

function startServer() {
    console.log('\n🚀 Starting PDF House Server...\n');
    
    const server = spawn('npm', ['start'], {
        cwd: backendDir,
        stdio: 'inherit'
    });

    server.on('error', (err) => {
        console.error('❌ Error:', err.message);
        process.exit(1);
    });
}

function startServerWithCLI() {
    console.log('\n🚀 Starting PDF House Server...');
    console.log('⏳ Waiting for server to start...\n');
    
    const server = spawn('npm', ['start'], {
        cwd: backendDir,
        stdio: 'pipe'
    });

    server.stdout.on('data', (data) => {
        console.log(data.toString());
        
        // When server is ready, start CLI
        if (data.toString().includes('berjalan di')) {
            console.log('\n✅ Server ready! Starting CLI...\n');
            setTimeout(() => {
                const cli = spawn('node', ['cli.js'], {
                    cwd: backendDir,
                    stdio: 'inherit'
                });
                
                cli.on('exit', () => {
                    server.kill();
                    process.exit(0);
                });
            }, 1000);
        }
    });

    server.stderr.on('data', (data) => {
        console.log('STDERR:', data.toString());
    });
}

function startServerWithMonitoring() {
    console.log('\n🚀 Starting PDF House Server with Monitoring...\n');
    
    const server = spawn('npm', ['start'], {
        cwd: backendDir,
        stdio: 'pipe'
    });

    server.stdout.on('data', (data) => {
        console.log(data.toString());
        
        if (data.toString().includes('berjalan di')) {
            console.log('\n✅ Server started! Starting monitor...\n');
            setTimeout(() => {
                const monitor = spawn('node', ['tools.js', 'monitor', '3000'], {
                    cwd: backendDir,
                    stdio: 'inherit'
                });
                
                monitor.on('exit', () => {
                    server.kill();
                    process.exit(0);
                });
            }, 1000);
        }
    });

    server.stderr.on('data', (data) => {
        console.log(data.toString());
    });
}

function runTests() {
    console.log('\n🧪 Running Tests & Validation...\n');
    
    const validate = spawn('node', ['validate.js'], {
        cwd: backendDir,
        stdio: 'inherit'
    });

    validate.on('exit', (code) => {
        console.log(`\n${code === 0 ? '✅' : '❌'} Tests completed\n`);
        process.exit(code);
    });
}

async function checkHealth() {
    console.log('\n🔍 Checking Server Health...\n');
    
    const options = {
        hostname: 'localhost',
        port: PORT,
        path: '/api/health',
        method: 'GET',
        timeout: 3000
    };

    const req = http.request(options, (res) => {
        let data = '';
        
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                console.log('✅ Server is running!');
                console.log('📍 Response:', parsed);
                console.log('\n🌐 Open: http://localhost:3000\n');
            } catch (err) {
                console.log('Raw response:', data);
            }
            process.exit(0);
        });
    });

    req.on('error', (err) => {
        console.log('❌ Server is not running!');
        console.log('⚠️  Error:', err.message);
        console.log('\n💡 Tip: Start server first with option 1\n');
        process.exit(1);
    });

    req.end();
}

function viewGuide() {
    console.log('\n📚 PDF House - Quick Guide\n');
    console.log(`
📄 PDF OPERATIONS:
  • Merge multiple PDFs
  • Split PDF pages
  • Compress PDF file
  • Convert PDF to images
  • Extract text from PDF
  • Add text to PDF

🔧 MANAGEMENT:
  • Start/Stop/Restart server
  • Monitor server performance
  • Check system health
  • Cleanup temp files
  • Batch process PDFs

🌐 WEB INTERFACE:
  • Open: http://localhost:3000
  • Upload PDF
  • Edit text with GUI
  • Apply formatting
  • Download result

💻 COMMAND LINE:
  • npm run cli        - Interactive menu
  • npm run tools      - Management tools
  • npm run batch      - Batch processor
  • npm run health     - Check health
  • npm run monitor    - Monitor server
  • npm run validate   - Validation

📖 FULL DOCUMENTATION:
  • COMPLETE_GUIDE.md  - Complete guide
  • README.md          - Project info
  • FEATURES.md        - Feature list
  • TESTING.md         - Testing guide

🚀 QUICK START:
  1. npm start         - Start server
  2. Open browser      - http://localhost:3000
  3. Upload PDF        - Use web interface
  4. Or use CLI        - npm run cli

❓ HELP:
  - Check COMPLETE_GUIDE.md for detailed help
  - Run validate tests: npm run validate
  - Check logs: npm run dev

    `);
    
    process.exit(0);
}
