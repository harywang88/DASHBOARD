const { spawn } = require('child_process');

// Check if a command exists and is executable
async function checkCommand(cmd, args = ['--version']) {
  return new Promise((resolve) => {
    try {
      const proc = spawn(cmd, args, {
        shell: true,
        timeout: 5000,
        windowsHide: true
      });

      let output = '';
      proc.stdout.on('data', (data) => {
        output += data.toString();
      });
      proc.stderr.on('data', (data) => {
        output += data.toString();
      });

      proc.on('close', (code) => {
        resolve({
          available: code === 0 || output.length > 0,
          version: output.trim().split('\n')[0] || 'unknown'
        });
      });

      proc.on('error', () => {
        resolve({ available: false, version: null });
      });

      // Timeout handler
      setTimeout(() => {
        try { proc.kill(); } catch (e) {}
        resolve({ available: false, version: 'timeout' });
      }, 5000);
    } catch (e) {
      resolve({ available: false, version: null });
    }
  });
}

// Check all required tools
async function checkAllTools() {
  const tools = {
    ffmpeg: { cmd: 'ffmpeg', args: ['-version'], required: true, description: 'Video/Audio conversion' },
    imagemagick: { cmd: 'magick', args: ['--version'], required: true, description: 'Image conversion' },
    libreoffice: { cmd: 'soffice', args: ['--version'], required: true, description: 'Document conversion' },
    '7zip': { cmd: '7z', args: [], required: false, description: '7Z archive creation' },
    sharp: { cmd: null, args: [], required: false, description: 'Image processing (Node.js)' }
  };

  const results = {};

  for (const [name, config] of Object.entries(tools)) {
    if (name === 'sharp') {
      // Check Sharp module
      try {
        require('sharp');
        results[name] = {
          available: true,
          version: 'installed',
          description: config.description,
          required: config.required
        };
      } catch (e) {
        results[name] = {
          available: false,
          version: null,
          description: config.description,
          required: config.required
        };
      }
    } else {
      const check = await checkCommand(config.cmd, config.args);
      results[name] = {
        ...check,
        description: config.description,
        required: config.required
      };
    }
  }

  return results;
}

// Print tools status to console
async function printToolsStatus() {
  console.log('\n=== Tools Status Check ===\n');

  const tools = await checkAllTools();
  let allRequired = true;

  for (const [name, status] of Object.entries(tools)) {
    const icon = status.available ? '\u2705' : (status.required ? '\u274c' : '\u26a0\ufe0f');
    const label = status.required ? '[Required]' : '[Optional]';
    console.log(`${icon} ${name.padEnd(12)} ${label.padEnd(12)} - ${status.description}`);
    if (status.version && status.available) {
      console.log(`   Version: ${status.version.substring(0, 50)}...`);
    }
    if (status.required && !status.available) {
      allRequired = false;
    }
  }

  console.log('\n');

  if (!allRequired) {
    console.log('\u26a0\ufe0f  Some required tools are missing. Some conversions may fail.');
    console.log('   See INSTALL-TOOLS.md for installation instructions.\n');
  } else {
    console.log('\u2705 All required tools are available!\n');
  }

  return tools;
}

// Get summary for API endpoint
async function getToolsSummary() {
  const tools = await checkAllTools();
  const summary = {
    tools,
    timestamp: new Date().toISOString(),
    allRequiredAvailable: Object.values(tools)
      .filter(t => t.required)
      .every(t => t.available),
    availableFormats: {
      images: tools.imagemagick.available || tools.sharp.available,
      video: tools.ffmpeg.available,
      audio: tools.ffmpeg.available,
      documents: tools.libreoffice.available,
      archives: true // ZIP always available via adm-zip
    }
  };
  return summary;
}

module.exports = {
  checkCommand,
  checkAllTools,
  printToolsStatus,
  getToolsSummary
};
