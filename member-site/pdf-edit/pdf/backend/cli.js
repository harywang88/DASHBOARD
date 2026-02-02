#!/usr/bin/env node

/**
 * PDF House CLI - Comprehensive Command-Line Interface
 * Version: 1.0.0
 * 
 * Features:
 * - Interactive menu system
 * - PDF operations (merge, split, compress, convert, extract)
 * - Server management
 * - Batch processing
 * - Health monitoring
 */

const fs = require('fs');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const readline = require('readline');

// Colors for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    dim: '\x1b[2m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m',
    magenta: '\x1b[35m'
};

// Utility functions
const log = {
    title: (text) => console.log(`\n${colors.bright}${colors.cyan}=== ${text} ===${colors.reset}\n`),
    success: (text) => console.log(`${colors.green}✅ ${text}${colors.reset}`),
    error: (text) => console.log(`${colors.red}❌ ${text}${colors.reset}`),
    info: (text) => console.log(`${colors.blue}ℹ️  ${text}${colors.reset}`),
    warning: (text) => console.log(`${colors.yellow}⚠️  ${text}${colors.reset}`),
    item: (text) => console.log(`${colors.dim}  → ${text}${colors.reset}`),
    section: (text) => console.log(`\n${colors.magenta}${text}${colors.reset}`)
};

// Main menu
async function showMainMenu() {
    log.title('PDF HOUSE - Main Menu');
    
    const menu = [
        '1. 📄 PDF Operations',
        '2. 🔧 Server Management',
        '3. 📊 Monitoring & Status',
        '4. 🛠️  Utilities & Tools',
        '5. 📚 Help & Documentation',
        '0. 🚪 Exit'
    ];
    
    menu.forEach(item => console.log(`  ${item}`));
    
    const choice = await getUserInput('\nSelect option: ');
    
    switch(choice) {
        case '1':
            await showPDFOperations();
            break;
        case '2':
            await showServerManagement();
            break;
        case '3':
            await showMonitoring();
            break;
        case '4':
            await showUtilities();
            break;
        case '5':
            await showHelp();
            break;
        case '0':
            log.success('Goodbye!');
            process.exit(0);
        default:
            log.error('Invalid option');
            await showMainMenu();
    }
}

// PDF Operations Menu
async function showPDFOperations() {
    log.title('PDF Operations');
    
    const menu = [
        '1. 🔀 Merge PDF files',
        '2. ✂️  Split PDF pages',
        '3. 🗜️  Compress PDF',
        '4. 🔄 Convert PDF (to images)',
        '5. 📖 Extract Text from PDF',
        '6. ➕ Add Text to PDF',
        '7. 🎨 Add Images to PDF',
        '8. ↩️  Back to Main Menu'
    ];
    
    menu.forEach(item => console.log(`  ${item}`));
    
    const choice = await getUserInput('\nSelect operation: ');
    
    switch(choice) {
        case '1':
            await mergePDFTool();
            break;
        case '2':
            await splitPDFTool();
            break;
        case '3':
            await compressPDFTool();
            break;
        case '4':
            await convertPDFTool();
            break;
        case '5':
            await extractTextTool();
            break;
        case '6':
            await addTextTool();
            break;
        case '7':
            await addImagesTool();
            break;
        case '8':
            await showMainMenu();
            return;
    }
    
    await showPDFOperations();
}

// Merge PDF Tool
async function mergePDFTool() {
    log.section('Merge Multiple PDFs');
    log.info('Enter PDF file paths (one per line, empty line to finish)');
    
    const files = [];
    while (true) {
        const file = await getUserInput('File path: ');
        if (!file) break;
        if (fs.existsSync(file)) {
            files.push(file);
            log.success(`Added: ${file}`);
        } else {
            log.error(`File not found: ${file}`);
        }
    }
    
    if (files.length < 2) {
        log.error('Need at least 2 files to merge');
        return;
    }
    
    const outputFile = await getUserInput('Output file name (default: merged.pdf): ') || 'merged.pdf';
    
    log.info(`Merging ${files.length} files...`);
    
    try {
        const result = await callAPI('/api/merge', 'POST', { files });
        if (result.success) {
            log.success(`Merged successfully!`);
            log.item(`Output: ${result.file}`);
            log.item(`Download: ${result.download}`);
        }
    } catch (err) {
        log.error(`Merge failed: ${err.message}`);
    }
}

// Split PDF Tool
async function splitPDFTool() {
    log.section('Split PDF Pages');
    
    const file = await getUserInput('PDF file path: ');
    if (!fs.existsSync(file)) {
        log.error(`File not found: ${file}`);
        return;
    }
    
    const pages = await getUserInput('Pages to extract (e.g., "1-5,7,9-10"): ');
    if (!pages) {
        log.error('Please specify pages');
        return;
    }
    
    log.info('Processing...');
    
    try {
        const result = await callAPI('/api/split', 'POST', { file, pages });
        if (result.success) {
            log.success('Split successfully!');
            log.item(`Output: ${result.file}`);
            log.item(`Download: ${result.download}`);
        }
    } catch (err) {
        log.error(`Split failed: ${err.message}`);
    }
}

// Compress PDF Tool
async function compressPDFTool() {
    log.section('Compress PDF');
    
    const file = await getUserInput('PDF file path: ');
    if (!fs.existsSync(file)) {
        log.error(`File not found: ${file}`);
        return;
    }
    
    console.log('\nCompression levels:');
    console.log('  1. Low (less compression, larger size)');
    console.log('  2. Medium (balanced)');
    console.log('  3. High (more compression, smaller size)');
    
    const levelChoice = await getUserInput('Select compression level (default: 2): ') || '2';
    const levels = { '1': 'low', '2': 'medium', '3': 'high' };
    const level = levels[levelChoice] || 'medium';
    
    log.info('Compressing...');
    
    try {
        const result = await callAPI('/api/compress', 'POST', { file, level });
        if (result.success) {
            log.success('Compressed successfully!');
            log.item(`Output: ${result.file}`);
            log.item(`Download: ${result.download}`);
        }
    } catch (err) {
        log.error(`Compression failed: ${err.message}`);
    }
}

// Convert PDF Tool
async function convertPDFTool() {
    log.section('Convert PDF');
    
    const file = await getUserInput('PDF file path: ');
    if (!fs.existsSync(file)) {
        log.error(`File not found: ${file}`);
        return;
    }
    
    console.log('\nConversion formats:');
    console.log('  1. PNG');
    console.log('  2. JPEG');
    console.log('  3. WebP');
    
    const format = await getUserInput('Select format (default: 1): ') || '1';
    const formats = { '1': 'png', '2': 'jpeg', '3': 'webp' };
    const outputFormat = formats[format] || 'png';
    
    log.info(`Converting to ${outputFormat}...`);
    
    try {
        const result = await callAPI('/api/convert', 'POST', { file, format: outputFormat });
        if (result.success) {
            log.success('Converted successfully!');
            log.item(`Output: ${result.file}`);
        }
    } catch (err) {
        log.error(`Conversion failed: ${err.message}`);
    }
}

// Extract Text Tool
async function extractTextTool() {
    log.section('Extract Text from PDF');
    
    const file = await getUserInput('PDF file path: ');
    if (!fs.existsSync(file)) {
        log.error(`File not found: ${file}`);
        return;
    }
    
    log.info('Extracting text...');
    
    try {
        const result = await callAPI('/api/extract-text', 'POST', { file });
        if (result.success) {
            log.success('Text extracted successfully!');
            log.item(`Total pages: ${result.totalPages}`);
            log.item(`Total text length: ${result.totalTextLength} characters`);
            
            const outputFile = file.replace('.pdf', '_extracted.txt');
            fs.writeFileSync(outputFile, result.fullText);
            log.success(`Text saved to: ${outputFile}`);
        }
    } catch (err) {
        log.error(`Extraction failed: ${err.message}`);
    }
}

// Add Text Tool
async function addTextTool() {
    log.section('Add Text to PDF');
    
    const file = await getUserInput('PDF file path: ');
    if (!fs.existsSync(file)) {
        log.error(`File not found: ${file}`);
        return;
    }
    
    const text = await getUserInput('Text to add: ');
    const fontSize = await getUserInput('Font size (default: 12): ') || '12';
    const color = await getUserInput('Color hex (default: #000000): ') || '#000000';
    
    log.info('Adding text...');
    
    try {
        const result = await callAPI('/api/edit', 'POST', {
            file,
            editMode: 'add',
            text,
            fontSize: parseInt(fontSize),
            color
        });
        
        if (result.success) {
            log.success('Text added successfully!');
            log.item(`Output: ${result.file}`);
        }
    } catch (err) {
        log.error(`Failed to add text: ${err.message}`);
    }
}

// Add Images Tool
async function addImagesTool() {
    log.section('Add Images to PDF');
    
    const file = await getUserInput('PDF file path: ');
    if (!fs.existsSync(file)) {
        log.error(`File not found: ${file}`);
        return;
    }
    
    log.info('This feature is available in the web interface');
    log.item('Visit: http://localhost:3000');
}

// Server Management Menu
async function showServerManagement() {
    log.title('Server Management');
    
    const menu = [
        '1. ▶️  Start Server',
        '2. 🛑 Stop Server',
        '3. 🔄 Restart Server',
        '4. 📋 View Server Logs',
        '5. 🔍 Check Server Health',
        '6. ↩️  Back to Main Menu'
    ];
    
    menu.forEach(item => console.log(`  ${item}`));
    
    const choice = await getUserInput('\nSelect option: ');
    
    switch(choice) {
        case '1':
            await startServer();
            break;
        case '2':
            await stopServer();
            break;
        case '3':
            await restartServer();
            break;
        case '4':
            await viewLogs();
            break;
        case '5':
            await checkHealth();
            break;
        case '6':
            await showMainMenu();
            return;
    }
    
    await showServerManagement();
}

// Start Server
async function startServer() {
    log.section('Starting Server...');
    
    try {
        const server = spawn('npm', ['start'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
        
        log.success('Server started!');
        log.info('Press Ctrl+C to stop');
    } catch (err) {
        log.error(`Failed to start server: ${err.message}`);
    }
}

// Stop Server
async function stopServer() {
    log.section('Stopping Server...');
    log.info('Killing processes on port 3000...');
    
    try {
        const result = spawnSync('taskkill', ['/F', '/IM', 'node.exe'], {
            encoding: 'utf8'
        });
        log.success('Server stopped!');
    } catch (err) {
        log.warning(`Could not stop server: ${err.message}`);
    }
}

// Restart Server
async function restartServer() {
    log.section('Restarting Server...');
    await stopServer();
    setTimeout(async () => {
        await startServer();
    }, 1000);
}

// View Logs
async function viewLogs() {
    log.section('Server Logs');
    log.info('Starting server with logs...');
    
    try {
        const server = spawn('npm', ['start'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
    } catch (err) {
        log.error(`Failed to view logs: ${err.message}`);
    }
}

// Check Health
async function checkHealth() {
    log.section('Server Health Check');
    
    try {
        log.info('Checking server health...');
        const result = await callAPI('/api/health', 'GET');
        log.success('Server is running!');
        log.item(`Status: ${result.status}`);
    } catch (err) {
        log.error(`Server is not responding: ${err.message}`);
        log.info('Start the server first using option 1');
    }
}

// Monitoring Menu
async function showMonitoring() {
    log.title('Monitoring & Status');
    
    const menu = [
        '1. 📊 System Status',
        '2. 📈 Server Metrics',
        '3. 📁 Disk Usage',
        '4. 🧹 Cleanup Temp Files',
        '5. 📋 View Configuration',
        '6. ↩️  Back to Main Menu'
    ];
    
    menu.forEach(item => console.log(`  ${item}`));
    
    const choice = await getUserInput('\nSelect option: ');
    
    switch(choice) {
        case '1':
            await showSystemStatus();
            break;
        case '2':
            await showMetrics();
            break;
        case '3':
            await showDiskUsage();
            break;
        case '4':
            await cleanupFiles();
            break;
        case '5':
            await showConfiguration();
            break;
        case '6':
            await showMainMenu();
            return;
    }
    
    await showMonitoring();
}

// Show System Status
async function showSystemStatus() {
    log.section('System Status');
    
    try {
        const health = await callAPI('/api/health', 'GET');
        log.success('Server Status: Online');
        log.item(`Message: ${health.status}`);
        log.item(`Timestamp: ${new Date().toLocaleString()}`);
    } catch (err) {
        log.error('Server Status: Offline');
    }
    
    // Show directory stats
    const uploadDir = path.join(__dirname, 'uploads');
    const outputDir = path.join(__dirname, 'output');
    
    const getStats = (dir) => {
        if (!fs.existsSync(dir)) return 0;
        return fs.readdirSync(dir).length;
    };
    
    log.section('File Statistics');
    log.item(`Uploads folder: ${getStats(uploadDir)} files`);
    log.item(`Output folder: ${getStats(outputDir)} files`);
}

// Show Metrics
async function showMetrics() {
    log.section('Server Metrics');
    
    const uptime = process.uptime();
    const memory = process.memoryUsage();
    
    log.item(`Process Uptime: ${Math.floor(uptime / 60)} minutes`);
    log.item(`Heap Used: ${Math.round(memory.heapUsed / 1024 / 1024)} MB`);
    log.item(`Heap Total: ${Math.round(memory.heapTotal / 1024 / 1024)} MB`);
    log.item(`RSS: ${Math.round(memory.rss / 1024 / 1024)} MB`);
}

// Show Disk Usage
async function showDiskUsage() {
    log.section('Disk Usage');
    
    const getDirSize = (dir) => {
        if (!fs.existsSync(dir)) return 0;
        const files = fs.readdirSync(dir);
        let size = 0;
        files.forEach(file => {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            size += stats.size;
        });
        return size;
    };
    
    const uploadDir = path.join(__dirname, 'uploads');
    const outputDir = path.join(__dirname, 'output');
    
    const uploadSize = getDirSize(uploadDir);
    const outputSize = getDirSize(outputDir);
    
    log.item(`Uploads: ${(uploadSize / 1024 / 1024).toFixed(2)} MB`);
    log.item(`Output: ${(outputSize / 1024 / 1024).toFixed(2)} MB`);
    log.item(`Total: ${((uploadSize + outputSize) / 1024 / 1024).toFixed(2)} MB`);
}

// Cleanup Files
async function cleanupFiles() {
    log.section('Cleanup Temp Files');
    
    const uploadDir = path.join(__dirname, 'uploads');
    const outputDir = path.join(__dirname, 'output');
    
    const cleanDir = (dir) => {
        if (!fs.existsSync(dir)) return 0;
        const files = fs.readdirSync(dir);
        let count = 0;
        files.forEach(file => {
            const filePath = path.join(dir, file);
            try {
                fs.unlinkSync(filePath);
                count++;
            } catch (err) {
                log.warning(`Could not delete: ${file}`);
            }
        });
        return count;
    };
    
    const uploadCount = cleanDir(uploadDir);
    const outputCount = cleanDir(outputDir);
    
    log.success(`Cleanup complete!`);
    log.item(`Deleted ${uploadCount} upload files`);
    log.item(`Deleted ${outputCount} output files`);
}

// Show Configuration
async function showConfiguration() {
    log.section('Configuration');
    
    try {
        const envFile = path.join(__dirname, '.env');
        if (fs.existsSync(envFile)) {
            const content = fs.readFileSync(envFile, 'utf8');
            console.log(content);
        } else {
            log.warning('No .env file found');
        }
    } catch (err) {
        log.error(`Failed to read configuration: ${err.message}`);
    }
}

// Utilities Menu
async function showUtilities() {
    log.title('Utilities & Tools');
    
    const menu = [
        '1. 🧪 Run Tests',
        '2. ✅ Validate Installation',
        '3. 📦 Check Dependencies',
        '4. 🔧 Install Dependencies',
        '5. 📄 Generate Report',
        '6. 🎯 Batch Process PDFs',
        '7. ↩️  Back to Main Menu'
    ];
    
    menu.forEach(item => console.log(`  ${item}`));
    
    const choice = await getUserInput('\nSelect option: ');
    
    switch(choice) {
        case '1':
            await runTests();
            break;
        case '2':
            await validateInstallation();
            break;
        case '3':
            await checkDependencies();
            break;
        case '4':
            await installDependencies();
            break;
        case '5':
            await generateReport();
            break;
        case '6':
            await batchProcessPDFs();
            break;
        case '7':
            await showMainMenu();
            return;
    }
    
    await showUtilities();
}

// Run Tests
async function runTests() {
    log.section('Running Tests');
    
    try {
        const result = spawnSync('node', ['validate.js'], {
            cwd: __dirname,
            encoding: 'utf8'
        });
        console.log(result.stdout);
        if (result.stderr) {
            console.error(result.stderr);
        }
    } catch (err) {
        log.error(`Failed to run tests: ${err.message}`);
    }
}

// Validate Installation
async function validateInstallation() {
    log.section('Validating Installation');
    
    try {
        spawnSync('node', ['validate.js'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
    } catch (err) {
        log.error(`Validation failed: ${err.message}`);
    }
}

// Check Dependencies
async function checkDependencies() {
    log.section('Checking Dependencies');
    
    try {
        const result = spawnSync('npm', ['list', '--depth=0'], {
            cwd: __dirname,
            encoding: 'utf8'
        });
        console.log(result.stdout);
    } catch (err) {
        log.error(`Failed to check dependencies: ${err.message}`);
    }
}

// Install Dependencies
async function installDependencies() {
    log.section('Installing Dependencies');
    
    try {
        log.info('Running npm install...');
        spawnSync('npm', ['install'], {
            cwd: __dirname,
            stdio: 'inherit'
        });
        log.success('Dependencies installed!');
    } catch (err) {
        log.error(`Failed to install dependencies: ${err.message}`);
    }
}

// Generate Report
async function generateReport() {
    log.section('Generate System Report');
    
    const report = {
        timestamp: new Date().toISOString(),
        nodeVersion: process.version,
        npmVersion: require('child_process').execSync('npm --version', { encoding: 'utf8' }).trim(),
        platform: process.platform,
        arch: process.arch,
        memory: process.memoryUsage(),
        uptime: process.uptime()
    };
    
    const reportFile = path.join(__dirname, `report-${Date.now()}.json`);
    fs.writeFileSync(reportFile, JSON.stringify(report, null, 2));
    
    log.success(`Report generated: ${reportFile}`);
    console.log(JSON.stringify(report, null, 2));
}

// Batch Process PDFs
async function batchProcessPDFs() {
    log.section('Batch Process PDFs');
    
    const inputDir = await getUserInput('Input directory path: ');
    if (!fs.existsSync(inputDir)) {
        log.error(`Directory not found: ${inputDir}`);
        return;
    }
    
    console.log('\nBatch operations:');
    console.log('  1. Compress all PDFs');
    console.log('  2. Extract text from all PDFs');
    console.log('  3. Get info about all PDFs');
    
    const operation = await getUserInput('Select operation: ');
    
    const files = fs.readdirSync(inputDir).filter(f => f.endsWith('.pdf'));
    log.info(`Found ${files.length} PDF files`);
    
    let processed = 0;
    for (const file of files) {
        try {
            const filePath = path.join(inputDir, file);
            log.item(`Processing: ${file}`);
            
            if (operation === '1') {
                // Compress
                await callAPI('/api/compress', 'POST', { file: filePath });
            } else if (operation === '2') {
                // Extract text
                await callAPI('/api/extract-text', 'POST', { file: filePath });
            }
            
            processed++;
        } catch (err) {
            log.warning(`Failed: ${file}`);
        }
    }
    
    log.success(`Batch processing complete! Processed ${processed}/${files.length} files`);
}

// Help Menu
async function showHelp() {
    log.title('Help & Documentation');
    
    const help = `
${colors.bright}PDF House CLI Commands${colors.reset}

${colors.magenta}📄 PDF OPERATIONS${colors.reset}
  • Merge PDF - Combine multiple PDF files
  • Split PDF - Extract specific pages from a PDF
  • Compress PDF - Reduce PDF file size
  • Convert PDF - Convert PDF to images (PNG, JPEG, WebP)
  • Extract Text - Extract all text from PDF
  • Add Text - Add text to PDF
  • Add Images - Add images to PDF (web interface)

${colors.magenta}🔧 SERVER MANAGEMENT${colors.reset}
  • Start Server - Launch the PDF House server
  • Stop Server - Stop the running server
  • Restart Server - Restart the server
  • View Logs - Monitor server logs
  • Health Check - Check if server is running

${colors.magenta}📊 MONITORING${colors.reset}
  • System Status - Check overall system health
  • Metrics - View server performance metrics
  • Disk Usage - Check storage usage
  • Cleanup - Remove temporary files
  • Configuration - View current settings

${colors.magenta}🛠️  UTILITIES${colors.reset}
  • Run Tests - Execute validation tests
  • Validate - Verify installation
  • Dependencies - Check installed packages
  • Generate Report - Create system report
  • Batch Process - Process multiple PDFs

${colors.magenta}📚 KEYBOARD SHORTCUTS${colors.reset}
  • Ctrl+C - Exit current operation
  • Ctrl+D - Exit the application
  • Arrow Keys - Navigate menus (when supported)

${colors.magenta}🌐 WEB INTERFACE${colors.reset}
  • Access at: http://localhost:3000
  • Full GUI for PDF editing and operations
  • Real-time preview and status updates

${colors.magenta}📖 GETTING STARTED${colors.reset}
  1. Start the server: Select option 2 → 1
  2. Open web browser: http://localhost:3000
  3. Upload PDF and use GUI or CLI tools
  4. Use CLI for batch operations and automation

${colors.magenta}⚠️  TROUBLESHOOTING${colors.reset}
  • Server won't start: Check if port 3000 is in use
  • File not found: Use absolute paths
  • Out of memory: Reduce file size or restart server
  • Dependencies missing: Run "npm install" from backend folder

${colors.magenta}📞 SUPPORT${colors.reset}
  • Check documentation: README.md, FEATURES.md, TESTING.md
  • Validate setup: Run "Validate Installation" from Utilities
  • Check logs: Use "View Logs" from Server Management
    `;
    
    console.log(help);
    
    await getUserInput('\nPress Enter to return to main menu...');
    await showMainMenu();
}

// Helper functions
async function getUserInput(prompt) {
    return new Promise((resolve) => {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question(`${colors.yellow}${prompt}${colors.reset}`, (answer) => {
            rl.close();
            resolve(answer.trim());
        });
    });
}

async function callAPI(endpoint, method = 'GET', data = null) {
    return new Promise((resolve, reject) => {
        const http = require('http');
        const querystring = require('querystring');
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: endpoint,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const req = http.request(options, (res) => {
            let responseData = '';
            
            res.on('data', (chunk) => {
                responseData += chunk;
            });
            
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(responseData);
                    resolve(parsed);
                } catch (err) {
                    reject(new Error('Invalid response from server'));
                }
            });
        });
        
        req.on('error', (err) => {
            reject(err);
        });
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        
        req.end();
    });
}

// Start the CLI
async function start() {
    console.clear();
    log.title('Welcome to PDF House CLI v1.0.0');
    log.info('Advanced PDF Operations & Management Tool');
    console.log(`${colors.dim}Type 'help' at any prompt for assistance${colors.reset}\n`);
    
    await showMainMenu();
}

// Run
start().catch(err => {
    log.error(`Fatal error: ${err.message}`);
    process.exit(1);
});
