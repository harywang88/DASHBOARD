const { spawn } = require('child_process');

function runCmd(cmd, args, opts = {}) {
  return new Promise((resolve, reject) => {
    if (typeof cmd !== 'string' || !Array.isArray(args)) {
      return reject(new Error('cmd must be string and args must be array'));
    }
    
    let stdout = '';
    let stderr = '';
    
    const p = spawn(cmd, args, { ...opts, stdio: ['pipe', 'pipe', 'pipe'] });
    
    if (!p) {
      return reject(new Error(`Failed to spawn process: ${cmd}`));
    }
    
    if (p.stdout) {
      p.stdout.on('data', d => {
        if (d) stdout += d.toString();
      });
    }
    
    if (p.stderr) {
      p.stderr.on('data', d => {
        if (d) stderr += d.toString();
      });
    }
    
    const timeout = setTimeout(() => {
      p.kill();
      reject(new Error(`Command timeout: ${cmd} ${args.join(' ')}`));
    }, 5 * 60 * 1000); // 5 minute timeout
    
    p.on('close', code => {
      clearTimeout(timeout);
      if (code === 0) {
        resolve({ stdout, stderr });
      } else {
        const errorMsg = stderr || `${cmd} exited with code ${code}`;
        reject(new Error(`${cmd} ${args.join(' ')} failed: ${errorMsg}`));
      }
    });
    
    p.on('error', err => {
      clearTimeout(timeout);
      reject(new Error(`Failed to execute ${cmd}: ${err.message}`));
    });
  });
}

module.exports = { runCmd };
