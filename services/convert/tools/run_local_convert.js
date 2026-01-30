const path = require('path');
const fs = require('fs');
const convert = require('../services/convert');

async function run() {
  try {
    const input = path.join(__dirname, '..', 'test-files', 'sample.txt');
    
    if (!fs.existsSync(input)) {
      console.error('Error: Test file not found:', input);
      process.exitCode = 1;
      return;
    }
    
    console.log('Converting file:', input);
    const out = await convert.convertFile(input, 'zip', {});
    console.log('✓ Conversion successful!');
    console.log('Output file:', out);
    console.log('File size:', fs.statSync(out).size, 'bytes');
    process.exitCode = 0;
  } catch (err) {
    console.error('✗ Conversion failed:', err.message || err);
    if (process.env.DEBUG) console.error('Stack:', err.stack);
    process.exitCode = 1;
  }
}

run();
