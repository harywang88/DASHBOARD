#!/usr/bin/env node
/**
 * CloudConvert-Local System Diagnostic
 * Checks: server.js, services, tools, and frontend
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

function log(color, label, msg) {
  console.log(`${color}[${label}]${RESET} ${msg}`);
}

function checkFile(filePath, description) {
  if (fs.existsSync(filePath)) {
    log(GREEN, '✅', `${description}: Found at ${filePath}`);
    return true;
  } else {
    log(RED, '❌', `${description}: NOT found at ${filePath}`);
    return false;
  }
}

function checkCommand(cmd, description) {
  return new Promise((resolve) => {
    const p = spawn(cmd, ['--version'], { stdio: 'pipe' });
    let timeout = setTimeout(() => {
      p.kill();
      log(RED, '❌', `${description}: Not in PATH or timeout`);
      resolve(false);
    }, 3000);
    
    p.on('close', (code) => {
      clearTimeout(timeout);
      if (code === 0) {
        log(GREEN, '✅', `${description}: Available`);
        resolve(true);
      } else {
        log(RED, '❌', `${description}: Failed with code ${code}`);
        resolve(false);
      }
    });
    
    p.on('error', () => {
      clearTimeout(timeout);
      log(RED, '❌', `${description}: Not found`);
      resolve(false);
    });
  });
}

async function runDiagnostic() {
  console.log(`\n${BLUE}=== CloudConvert-Local System Diagnostic ===${RESET}\n`);
  
  const baseDir = __dirname;
  const uploadsDir = path.join(baseDir, 'uploads');
  
  // Check files
  console.log(`${BLUE}📋 File Structure:${RESET}`);
  checkFile(path.join(baseDir, 'server.js'), 'Main server');
  checkFile(path.join(baseDir, 'package.json'), 'Package config');
  checkFile(path.join(baseDir, 'frontend', 'index.html'), 'Frontend');
  checkFile(path.join(baseDir, 'services', 'convert.js'), 'Convert service');
  checkFile(path.join(baseDir, 'services', 'queue.js'), 'Queue service');
  checkFile(path.join(baseDir, 'services', 'utils.js'), 'Utils service');
  
  // Check directories
  console.log(`\n${BLUE}📁 Directories:${RESET}`);
  if (!fs.existsSync(uploadsDir)) {
    log(YELLOW, '⚠️ ', 'Uploads directory missing - creating...');
    fs.mkdirSync(uploadsDir, { recursive: true });
    log(GREEN, '✅', 'Uploads directory created');
  } else {
    log(GREEN, '✅', 'Uploads directory exists');
  }
  
  // Check Node modules
  console.log(`\n${BLUE}📦 Dependencies:${RESET}`);
  const nodeModulesDir = path.join(baseDir, 'node_modules');
  const deps = ['express', 'cors', 'multer', 'adm-zip', 'uuid'];
  let allDepsOk = true;
  
  for (const dep of deps) {
    if (fs.existsSync(path.join(nodeModulesDir, dep))) {
      log(GREEN, '✅', `${dep}: Installed`);
    } else {
      log(RED, '❌', `${dep}: NOT installed`);
      allDepsOk = false;
    }
  }
  
  if (!allDepsOk) {
    log(YELLOW, '⚠️ ', 'Run: npm install');
  }
  
  // Check system tools
  console.log(`\n${BLUE}🔧 System Tools:${RESET}`);
  const tools = [
    ['magick', 'ImageMagick (magick)'],
    ['convert', 'ImageMagick (convert)'],
    ['ffmpeg', 'FFmpeg'],
    ['libreoffice', 'LibreOffice'],
    ['soffice', 'LibreOffice (soffice)'],
    ['7z', '7-Zip'],
  ];
  
  const toolResults = [];
  for (const [cmd, desc] of tools) {
    const result = await checkCommand(cmd, desc);
    toolResults.push({ cmd, desc, result });
  }
  
  // Summary
  console.log(`\n${BLUE}📊 Tool Summary:${RESET}`);
  const hasImageMagick = toolResults.find(t => t.cmd === 'magick' || t.cmd === 'convert')?.result;
  const hasFFmpeg = toolResults.find(t => t.cmd === 'ffmpeg')?.result;
  const hasLibreOffice = toolResults.find(t => t.cmd === 'libreoffice' || t.cmd === 'soffice')?.result;
  
  log(
    hasImageMagick ? GREEN : RED,
    hasImageMagick ? '✅' : '❌',
    `Image conversion: ${hasImageMagick ? 'OK' : 'MISSING - Install ImageMagick'}`
  );
  log(
    hasFFmpeg ? GREEN : RED,
    hasFFmpeg ? '✅' : '❌',
    `Video/Audio: ${hasFFmpeg ? 'OK' : 'MISSING - Install FFmpeg'}`
  );
  log(
    hasLibreOffice ? GREEN : RED,
    hasLibreOffice ? '✅' : '❌',
    `Document conversion: ${hasLibreOffice ? 'OK' : 'MISSING - Install LibreOffice'}`
  );
  
  // Quick start
  console.log(`\n${BLUE}🚀 Quick Start:${RESET}`);
  log(YELLOW, 'ℹ️', 'Start server with: npm start');
  log(YELLOW, 'ℹ️', 'Open browser at: http://localhost:3000');
  log(YELLOW, 'ℹ️', 'Check health: http://localhost:3000/health');
  
  console.log(`\n${BLUE}📝 Next Steps:${RESET}`);
  if (!allDepsOk) {
    log(YELLOW, '1️⃣', 'npm install');
  }
  if (!hasImageMagick || !hasFFmpeg || !hasLibreOffice) {
    log(YELLOW, !allDepsOk ? '2️⃣' : '1️⃣', 'Install missing tools (see DIAGNOSTIC.md)');
  }
  const nextStep = (!allDepsOk || !hasImageMagick || !hasFFmpeg || !hasLibreOffice) ? 3 : 1;
  log(YELLOW, `${nextStep}️⃣`, 'npm start');
  log(YELLOW, `${nextStep + 1}️⃣`, 'Visit http://localhost:3000');
  
  console.log(`\n${GREEN}Diagnostic complete!${RESET}\n`);
}

runDiagnostic().catch(err => {
  console.error('Diagnostic error:', err);
  process.exit(1);
});
