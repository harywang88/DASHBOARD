const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const AdmZip = require('adm-zip');
const { runCmd } = require('./utils');
let sharp = null;
try {
  sharp = require('sharp');
} catch (e) {
  console.warn('⚠️ Sharp not installed - some image formats may not work');
}

const IMAGE_FORMATS = ['jpg','jpeg','png','webp','tiff','gif','bmp','svg','ico'];
const VIDEO_FORMATS = ['mp4','mkv','webm','avi','mov','wmv','flv','m3u8','mpg','mpeg'];
const AUDIO_FORMATS = ['mp3','wav','flac','aac','ogg','m4a','wma','opus'];
const DOCUMENT_FORMATS = ['pdf','docx','odt','html','txt','pptx','xlsx','rtf','doc'];

async function convertFile(inputPath, targetFormat, options = {}) {
  if (!targetFormat) throw new Error('targetFormat is required');
  if (typeof targetFormat !== 'string') throw new Error('targetFormat must be a string');
  if (!inputPath || typeof inputPath !== 'string') throw new Error('inputPath is required');
  if (!fs.existsSync(inputPath)) throw new Error('Input file does not exist: ' + inputPath);
  if (typeof options !== 'object' || options === null) throw new Error('options must be an object');
  
  const ext = targetFormat.toLowerCase().trim();
  if (!/^[a-z0-9]+$/.test(ext)) throw new Error('Invalid format: ' + targetFormat);
  if (ext.length > 10) throw new Error('Format name too long');
  
  const outName = `${uuidv4()}.${ext}`;
  const outDir = path.dirname(inputPath);
  const outputPath = path.join(outDir, outName);
  
  try {
    // Validate options
    if (options.quality && (typeof options.quality !== 'number' || options.quality < 1 || options.quality > 100)) {
      throw new Error('quality must be between 1 and 100');
    }
    if (options.bitrate && typeof options.bitrate !== 'string') {
      throw new Error('bitrate must be a string (e.g. "5M")');
    }
    if (options.targetFileSize && typeof options.targetFileSize !== 'number') {
      throw new Error('targetFileSize must be a number (in bytes)');
    }

    // Image conversions (ImageMagick or Sharp fallback)
    if (IMAGE_FORMATS.includes(ext)) {
      const args = [inputPath, outputPath];
      if (options.quality) args.splice(1, 0, '-quality', String(options.quality));
      
      // Try ImageMagick first
      const commands = [
        'magick',
        'magick.exe',
        'C:\\Program Files\\ImageMagick-7.1.1-Q16\\magick.exe',
        'C:\\Program Files (x86)\\ImageMagick-7.1.1-Q16\\magick.exe',
        '/usr/bin/magick',
        '/usr/local/bin/magick'
      ];
      
      let lastError = null;
      for (const cmd of commands) {
        try {
          await runCmd(cmd, args);
          if (fs.existsSync(outputPath)) return outputPath;
        } catch (e) {
          lastError = e;
          continue;
        }
      }
      
      // Fallback to Sharp if ImageMagick not found
      if (sharp && ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'tiff', 'gif'].includes(ext)) {
        try {
          console.log(`📦 Using Sharp for ${ext} conversion...`);
          let transform = sharp(inputPath);
          if (options.quality && (ext === 'jpg' || ext === 'jpeg')) {
            transform = transform.jpeg({ quality: Number(options.quality) });
          } else if (ext === 'webp') {
            transform = transform.webp({ quality: options.quality ? Number(options.quality) : 80 });
          } else if (ext === 'png') {
            transform = transform.png();
          } else if (ext === 'bmp') {
            transform = transform.bmp();
          } else if (ext === 'tiff') {
            transform = transform.tiff();
          } else if (ext === 'gif') {
            transform = transform.gif();
          }
          await transform.toFile(outputPath);
          if (fs.existsSync(outputPath)) return outputPath;
        } catch (e) {
          lastError = e;
          console.error('Sharp error:', e.message);
        }
      }
      
      throw new Error('Image conversion failed; ensure ImageMagick is installed - ' + (lastError?.message || 'command not found'));
    }

    // GIF to Video conversions (ffmpeg) - e.g. GIF to WebM, MP4
    const inputExt = path.extname(inputPath).toLowerCase().slice(1);
    if (inputExt === 'gif' && VIDEO_FORMATS.includes(ext)) {
      try {
        console.log(`Converting GIF to ${ext.toUpperCase()} using FFmpeg...`);
        let args = ['-i', inputPath];

        if (ext === 'webm') {
          // Optimized settings for GIF to WebM
          args.push('-c:v', 'libvpx-vp9', '-crf', '30', '-b:v', '0', '-pix_fmt', 'yuva420p');
          if (options.quality) {
            const crf = Math.round(63 - (options.quality * 0.53)); // Map 1-100 to 63-10
            args[args.indexOf('-crf') + 1] = String(crf);
          }
        } else if (ext === 'mp4') {
          // Optimized settings for GIF to MP4
          args.push('-movflags', 'faststart', '-pix_fmt', 'yuv420p', '-vf', 'scale=trunc(iw/2)*2:trunc(ih/2)*2');
          if (options.quality) {
            const crf = Math.round(51 - (options.quality * 0.41)); // Map 1-100 to 51-10
            args.push('-crf', String(crf));
          }
        }

        if (options.bitrate) args.push('-b:v', String(options.bitrate));
        args.push('-y', outputPath);

        await runCmd('ffmpeg', args);
        if (!fs.existsSync(outputPath)) throw new Error('Conversion produced no output');
        return outputPath;
      } catch (err) {
        throw new Error('GIF to video conversion failed; ensure ffmpeg is installed - ' + err.message);
      }
    }

    // Video conversions (ffmpeg)
    if (VIDEO_FORMATS.includes(ext)) {
      try {
        const args = ['-i', inputPath, '-y', outputPath];
        if (options.bitrate) args.unshift('-b:v', String(options.bitrate));
        await runCmd('ffmpeg', args);
        if (!fs.existsSync(outputPath)) throw new Error('Conversion produced no output');
        return outputPath;
      } catch (err) {
        throw new Error('Video conversion failed; ensure ffmpeg is installed - ' + err.message);
      }
    }

    // Audio conversions (ffmpeg)
    if (AUDIO_FORMATS.includes(ext)) {
      try {
        const args = ['-i', inputPath, '-y', outputPath];
        await runCmd('ffmpeg', args);
        if (!fs.existsSync(outputPath)) throw new Error('Conversion produced no output');
        return outputPath;
      } catch (err) {
        throw new Error('Audio conversion failed; ensure ffmpeg is installed - ' + err.message);
      }
    }

    // Documents (libreoffice)
    if (DOCUMENT_FORMATS.includes(ext)) {
      try {
        if (ext === 'pdf') {
          await runCmd('libreoffice', ['--headless', '--convert-to', 'pdf', '--outdir', outDir, inputPath]);
          const base = path.basename(inputPath, path.extname(inputPath)) + '.pdf';
          const candidate = path.join(outDir, base);
          if (fs.existsSync(candidate)) return candidate;
        }
        await runCmd('libreoffice', ['--headless', '--convert-to', ext, '--outdir', outDir, inputPath]);
        const base2 = path.basename(inputPath, path.extname(inputPath)) + '.' + ext;
        const cand2 = path.join(outDir, base2);
        if (fs.existsSync(cand2)) return cand2;
        throw new Error('LibreOffice conversion produced no output');
      } catch (err) {
        throw new Error('Document conversion failed; ensure LibreOffice (soffice) is installed - ' + err.message);
      }
    }

    // Archive -> zip
    if (ext === 'zip') {
      const zip = new AdmZip();
      const stat = fs.statSync(inputPath);
      if (stat.isFile()) zip.addLocalFile(inputPath);
      else zip.addLocalFolder(inputPath, path.basename(inputPath));
      zip.writeZip(outputPath);
      if (!fs.existsSync(outputPath)) throw new Error('ZIP creation produced no output');
      return outputPath;
    }

    // Archive -> 7z (requires 7z command)
    if (ext === '7z') {
      try {
        await runCmd('7z', ['a', outputPath, inputPath]);
        if (!fs.existsSync(outputPath)) throw new Error('7z creation produced no output');
        return outputPath;
      } catch (err) {
        throw new Error('7z conversion failed; ensure 7-Zip is installed - ' + err.message);
      }
    }

    // Archive -> rar (requires rar or unrar command)
    if (ext === 'rar') {
      try {
        // Try using 'rar' command first
        try {
          await runCmd('rar', ['a', outputPath, inputPath]);
          if (!fs.existsSync(outputPath)) throw new Error('RAR creation produced no output');
          return outputPath;
        } catch (e) {
          // If rar command fails, try with WinRAR path on Windows
          if (process.platform === 'win32') {
            await runCmd('C:\\Program Files\\WinRAR\\rar.exe', ['a', outputPath, inputPath]);
            if (!fs.existsSync(outputPath)) throw new Error('RAR creation produced no output');
            return outputPath;
          }
          throw e;
        }
      } catch (err) {
        throw new Error('RAR conversion failed; ensure WinRAR or rar command is installed - ' + err.message);
      }
    }

    throw new Error('Unsupported target format: ' + targetFormat);
  } catch (err) {
    // Cleanup output file if conversion failed
    if (fs.existsSync(outputPath)) {
      try { fs.unlinkSync(outputPath); } catch (e) {}
    }
    throw err;
  }
}

// Helper function to safely unlink file with retry on Windows
async function safeUnlink(filePath, maxRetries = 5, delayMs = 100) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return true;
    } catch (err) {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
        continue;
      }
      console.warn(`⚠️ Could not delete ${path.basename(filePath)}: ${err.message}`);
      return false;
    }
  }
}

// Helper function to safely copy file with retry on Windows
async function safeCopy(srcPath, dstPath, maxRetries = 5, delayMs = 100) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, delayMs)); // Wait before copy
      fs.copyFileSync(srcPath, dstPath);
      return true;
    } catch (err) {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * 2));
        continue;
      }
      throw err;
    }
  }
}

// Helper function to safely rename file with retry on Windows
async function safeRename(srcPath, dstPath, maxRetries = 5, delayMs = 100) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      await new Promise(resolve => setTimeout(resolve, delayMs)); // Wait before rename
      fs.renameSync(srcPath, dstPath);
      return true;
    } catch (err) {
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delayMs * 2));
        continue;
      }
      // Fallback to copy if rename fails
      console.log('Rename failed, trying copy instead...');
      await safeCopy(srcPath, dstPath, 3, delayMs);
      await safeUnlink(srcPath, 3, delayMs);
      return true;
    }
  }
}

// Helper function to get video duration using ffprobe
async function getVideoDuration(filePath) {
  try {
    const result = await runCmd('ffprobe', [
      '-v', 'error',
      '-show_entries', 'format=duration',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ]);
    const duration = parseFloat(result.stdout.trim());
    return isNaN(duration) ? 10 : duration; // Default to 10 seconds if can't determine
  } catch (e) {
    console.warn('Could not get video duration:', e.message);
    return 10; // Default fallback
  }
}

// Helper function to compress VIDEO to target file size
async function compressVideoToTargetSize(filePath, targetFileSize) {
  const stats = fs.statSync(filePath);
  const fileSizeBytes = stats.size;
  const ext = path.extname(filePath).toLowerCase().slice(1);

  console.log(`🎬 Compressing video ${path.basename(filePath)} to target size...`);
  console.log(`   Current: ${(fileSizeBytes / 1024).toFixed(2)}KB → Target: ${(targetFileSize / 1024).toFixed(2)}KB`);

  if (fileSizeBytes <= targetFileSize) {
    console.log(`✅ Video already at optimal size!`);
    return filePath;
  }

  // Get video duration
  const duration = await getVideoDuration(filePath);
  console.log(`   Video duration: ${duration.toFixed(2)} seconds`);

  // Calculate target bitrate (in kbps)
  // Formula: bitrate = (targetSize * 8) / duration
  // We use 97% of target to get as close as possible while leaving minimal room for overhead
  const targetBitrate = Math.floor((targetFileSize * 8 * 0.97) / duration / 1000);
  console.log(`   Target bitrate: ${targetBitrate}k`);

  if (targetBitrate < 50) {
    console.log(`⚠️ Target bitrate too low (${targetBitrate}k). Using minimum 50k.`);
  }

  const actualBitrate = Math.max(targetBitrate, 50); // Minimum 50kbps
  const tempPath = filePath.replace(/\.[^.]+$/, `.compressed.${ext}`);

  try {
    let args = ['-i', filePath, '-y'];

    if (ext === 'webm') {
      // Two-pass encoding for better quality at target bitrate
      args.push(
        '-c:v', 'libvpx-vp9',
        '-b:v', `${actualBitrate}k`,
        '-maxrate', `${actualBitrate * 1.5}k`,
        '-bufsize', `${actualBitrate * 2}k`,
        '-crf', '35',
        '-pix_fmt', 'yuva420p',
        '-an' // No audio for GIF conversions
      );
    } else if (ext === 'mp4') {
      args.push(
        '-c:v', 'libx264',
        '-b:v', `${actualBitrate}k`,
        '-maxrate', `${actualBitrate * 1.5}k`,
        '-bufsize', `${actualBitrate * 2}k`,
        '-preset', 'slow',
        '-pix_fmt', 'yuv420p',
        '-movflags', 'faststart',
        '-an'
      );
    } else {
      // Generic video compression
      args.push('-b:v', `${actualBitrate}k`);
    }

    args.push(tempPath);

    await runCmd('ffmpeg', args);

    if (fs.existsSync(tempPath)) {
      const compressedSize = fs.statSync(tempPath).size;
      const percentage = ((compressedSize / targetFileSize) * 100).toFixed(1);
      console.log(`✅ Compressed video: ${(compressedSize / 1024).toFixed(2)}KB (${percentage}% of target ${(targetFileSize / 1024).toFixed(2)}KB)`);

      // Replace original with compressed version
      try { fs.unlinkSync(filePath); } catch (e) {}
      fs.renameSync(tempPath, filePath);
      return filePath;
    }
  } catch (e) {
    console.error('Video compression error:', e.message);
    try { fs.unlinkSync(tempPath); } catch (e2) {}
  }

  return filePath;
}

// Helper function to compress image to target file size
async function compressImageToTargetSize(filePath, targetFileSize) {
  if (!targetFileSize) return filePath;

  const stats = fs.statSync(filePath);
  const fileSizeBytes = stats.size;
  const ext = path.extname(filePath).toLowerCase().slice(1);

  console.log(`📦 Checking file size: ${(fileSizeBytes / 1024).toFixed(2)}KB vs Target: ${(targetFileSize / 1024).toFixed(2)}KB`);

  if (fileSizeBytes <= targetFileSize) {
    console.log(`✅ File already at optimal size (${(fileSizeBytes / 1024).toFixed(2)}KB ≤ ${(targetFileSize / 1024).toFixed(2)}KB). No compression needed.`);
    return filePath;
  }

  // Handle VIDEO compression
  if (['webm', 'mp4', 'mkv', 'avi', 'mov'].includes(ext)) {
    return await compressVideoToTargetSize(filePath, targetFileSize);
  }

  // Handle IMAGE compression (requires sharp)
  if (!sharp) {
    console.log('⚠️ Sharp not available for image compression');
    return filePath;
  }

  if (!['jpg', 'jpeg', 'webp', 'png'].includes(ext)) {
    console.log(`⚠️ Cannot compress ${ext} format`);
    return filePath;
  }

  console.log(`📦 Compressing image ${path.basename(filePath)} to reach target...`);
  console.log(`   Current: ${(fileSizeBytes / 1024).toFixed(2)}KB → Target: ${(targetFileSize / 1024).toFixed(2)}KB`);

  let quality = 80;
  const maxIterations = 15;
  let iteration = 0;
  let bestMatch = null;

  while (quality >= 5 && iteration < maxIterations) {
    iteration++;

    try {
      const tempPath = filePath + `.tmp.${quality}`;
      let transform = sharp(filePath);

      if (ext === 'jpg' || ext === 'jpeg') {
        transform = transform.jpeg({ quality, progressive: true });
      } else if (ext === 'webp') {
        transform = transform.webp({ quality, alphaQuality: quality });
      } else if (ext === 'png') {
        // For PNG, reduce colors and use maximum compression
        transform = transform.png({ compressionLevel: 9, palette: quality < 50 });
      }

      await transform.toFile(tempPath);

      if (!fs.existsSync(tempPath)) {
        quality -= 10;
        continue;
      }

      const compressedSize = fs.statSync(tempPath).size;
      console.log(`   Quality ${quality}: ${(compressedSize / 1024).toFixed(2)}KB`);

      if (compressedSize <= targetFileSize) {
        // Found a good match!
        if (bestMatch) {
          try { fs.unlinkSync(bestMatch.path); } catch (e) {}
        }
        bestMatch = { path: tempPath, size: compressedSize };
        break; // Stop - we found one that fits
      } else {
        // Track closest match even if over target
        if (!bestMatch || compressedSize < bestMatch.size) {
          if (bestMatch) {
            try { fs.unlinkSync(bestMatch.path); } catch (e) {}
          }
          bestMatch = { path: tempPath, size: compressedSize };
        } else {
          try { fs.unlinkSync(tempPath); } catch (e) {}
        }
      }

    } catch (e) {
      console.error(`Error at quality ${quality}:`, e.message);
    }

    quality -= 10;
  }

  // Apply best match found
  if (bestMatch && fs.existsSync(bestMatch.path)) {
    console.log(`✅ Best compression: ${(bestMatch.size / 1024).toFixed(2)}KB (target: ${(targetFileSize / 1024).toFixed(2)}KB)`);

    try { fs.unlinkSync(filePath); } catch (e) {}
    await new Promise(resolve => setTimeout(resolve, 100));
    fs.renameSync(bestMatch.path, filePath);

    // Clean up temp files
    try {
      const files = fs.readdirSync(path.dirname(filePath));
      files.forEach(f => {
        if (f.includes('.tmp.')) {
          try { fs.unlinkSync(path.join(path.dirname(filePath), f)); } catch (e) {}
        }
      });
    } catch (e) {}

    return filePath;
  }

  return filePath;
}

// Helper function to check and compress if needed (deprecated, use compressImageToTargetSize)
async function checkFileSizeLimit(filePath, maxFileSize) {
  if (!maxFileSize) return filePath;
  const stats = fs.statSync(filePath);
  const fileSizeBytes = stats.size;
  
  if (fileSizeBytes <= maxFileSize) {
    return filePath;
  }
  
  console.warn(`⚠️ File size ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB exceeds limit ${(maxFileSize / 1024 / 1024).toFixed(2)}MB. Auto-compressing...`);
  
  const ext = path.extname(filePath).toLowerCase().slice(1);
  if (sharp && ['jpg', 'jpeg', 'webp', 'png'].includes(ext)) {
    const compressedPath = filePath.replace(/\.[^.]+$/, `-compressed.${ext}`);
    let transform = sharp(filePath);
    
    if (ext === 'jpg' || ext === 'jpeg') {
      transform = transform.jpeg({ quality: 60 });
    } else if (ext === 'webp') {
      transform = transform.webp({ quality: 60 });
    }
    
    await transform.toFile(compressedPath);
    
    if (fs.existsSync(compressedPath)) {
      const compressedSize = fs.statSync(compressedPath).size;
      if (compressedSize < fileSizeBytes) {
        fs.unlinkSync(filePath);
        fs.renameSync(compressedPath, filePath);
        console.log(`✅ Compressed to ${(compressedSize / 1024 / 1024).toFixed(2)}MB`);
        return filePath;
      } else {
        fs.unlinkSync(compressedPath);
      }
    }
  }
  
  return filePath;
}

// Main compression function that handles all formats (keeps same format)
async function compressToTargetSize(filePath, targetBytes, ext) {
  const stats = fs.statSync(filePath);
  const originalSize = stats.size;

  console.log(`🗜️ Compressing ${path.basename(filePath)} to target ${(targetBytes / 1024).toFixed(2)}KB...`);
  console.log(`   Original size: ${(originalSize / 1024).toFixed(2)}KB`);

  if (originalSize <= targetBytes) {
    console.log(`✅ File already under target size!`);
    return filePath;
  }

  const outputPath = filePath.replace(/\.[^.]+$/, `_compressed.${ext}`);

  // Handle GIF compression
  if (ext === 'gif') {
    return await compressGifToTargetSize(filePath, targetBytes, outputPath);
  }

  // Handle video compression (MP4, WebM)
  if (['mp4', 'webm', 'mkv', 'avi', 'mov'].includes(ext)) {
    const result = await compressVideoToTargetSize(filePath, targetBytes);
    return result;
  }

  // Handle image compression (JPG, PNG, WebP)
  if (['jpg', 'jpeg', 'png', 'webp'].includes(ext)) {
    return await compressImageOnly(filePath, targetBytes, ext, outputPath);
  }

  console.log(`⚠️ Unsupported format for compression: ${ext}`);
  return filePath;
}

// Compress GIF to target size - NO dimension or color changes, only frame dropping
async function compressGifToTargetSize(filePath, targetBytes, outputPath) {
  const originalSize = fs.statSync(filePath).size;

  console.log(`🎞️ Compressing GIF (keeping original size & colors)...`);
  console.log(`   Target: ${(targetBytes / 1024).toFixed(2)}KB`);

  // Get original GIF info (fps)
  let originalFps = 10; // default
  try {
    const result = await runCmd('ffprobe', [
      '-v', 'error',
      '-select_streams', 'v:0',
      '-show_entries', 'stream=r_frame_rate',
      '-of', 'default=noprint_wrappers=1:nokey=1',
      filePath
    ]);
    const fpsStr = result.stdout.trim();
    if (fpsStr.includes('/')) {
      const [num, den] = fpsStr.split('/').map(Number);
      originalFps = Math.round(num / den);
    } else {
      originalFps = Math.round(parseFloat(fpsStr));
    }
    if (isNaN(originalFps) || originalFps <= 0) originalFps = 10;
  } catch (e) {
    console.log(`   Could not detect FPS, using default: ${originalFps}`);
  }
  console.log(`   Original FPS: ${originalFps}`);

  // Calculate compression ratio needed
  const ratio = originalSize / targetBytes;
  console.log(`   Compression ratio needed: ${ratio.toFixed(2)}x`);

  // Try to find optimal FPS using binary search approach
  // Goal: get as CLOSE to target as possible (not smallest under target)
  let bestPath = null;
  let bestSize = originalSize;
  let bestFps = originalFps;

  // Start from high FPS and go down until we find one under target
  // Then fine-tune to get closest to target
  const fpsToTry = [];

  // Generate FPS values to try (from high to low)
  for (let fps = Math.max(originalFps - 1, 1); fps >= 1; fps--) {
    fpsToTry.push(fps);
  }
  // Also try fractional FPS for fine-tuning
  fpsToTry.push(0.5);

  let foundUnderTarget = false;
  let closestUnderTarget = null;

  for (const fps of fpsToTry) {
    const tempPath = filePath + `.fps${fps}.gif`;
    try {
      // Use FFmpeg with palettegen to preserve colors but reduce frames
      // Key: NO scaling, NO color reduction, just frame dropping
      await runCmd('ffmpeg', [
        '-i', filePath,
        '-vf', `fps=${fps},split[s0][s1];[s0]palettegen=stats_mode=diff[p];[s1][p]paletteuse=dither=none`,
        '-y', tempPath
      ]);

      if (fs.existsSync(tempPath)) {
        const size = fs.statSync(tempPath).size;
        console.log(`   FPS ${fps}: ${(size / 1024).toFixed(2)}KB`);

        if (size <= targetBytes) {
          foundUnderTarget = true;
          // This is under target - is it closer than previous best?
          if (!closestUnderTarget || size > closestUnderTarget.size) {
            // This is closer to target (larger but still under)
            if (closestUnderTarget) {
              try { fs.unlinkSync(closestUnderTarget.path); } catch (e) {}
            }
            closestUnderTarget = { path: tempPath, size, fps };
          } else {
            try { fs.unlinkSync(tempPath); } catch (e) {}
          }
          // If we're within 5% of target, stop searching
          if (size >= targetBytes * 0.95) {
            console.log(`   Found optimal: ${(size / 1024).toFixed(2)}KB (${((size/targetBytes)*100).toFixed(1)}% of target)`);
            break;
          }
        } else {
          // Still over target, keep this as best if smaller than previous
          if (size < bestSize) {
            if (bestPath) try { fs.unlinkSync(bestPath); } catch (e) {}
            bestPath = tempPath;
            bestSize = size;
            bestFps = fps;
          } else {
            try { fs.unlinkSync(tempPath); } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.log(`   FPS ${fps}: failed - ${e.message}`);
    }
  }

  // Use the closest result under target if found
  if (closestUnderTarget) {
    fs.copyFileSync(closestUnderTarget.path, outputPath);
    try { fs.unlinkSync(closestUnderTarget.path); } catch (e) {}
    if (bestPath) try { fs.unlinkSync(bestPath); } catch (e) {}

    const percentage = ((closestUnderTarget.size / targetBytes) * 100).toFixed(1);
    console.log(`✅ GIF compressed: ${(originalSize / 1024).toFixed(2)}KB -> ${(closestUnderTarget.size / 1024).toFixed(2)}KB (${percentage}% of target)`);
    return outputPath;
  }

  // If no result under target, use the smallest we could get
  if (bestPath) {
    fs.copyFileSync(bestPath, outputPath);
    try { fs.unlinkSync(bestPath); } catch (e) {}
    console.log(`⚠️ GIF compressed to smallest possible: ${(originalSize / 1024).toFixed(2)}KB -> ${(bestSize / 1024).toFixed(2)}KB`);
    console.log(`   (Could not reach target ${(targetBytes / 1024).toFixed(2)}KB with frame dropping only)`);
    return outputPath;
  }

  console.log(`⚠️ Could not compress GIF. Keeping original.`);
  return filePath;
}

// Compress image only (JPG, PNG, WebP) - get as close to target as possible
async function compressImageOnly(filePath, targetBytes, ext, outputPath) {
  if (!sharp) {
    console.log('⚠️ Sharp not available');
    return filePath;
  }

  const originalSize = fs.statSync(filePath).size;
  console.log(`🖼️ Compressing ${ext.toUpperCase()} image...`);
  console.log(`   Target: ${(targetBytes / 1024).toFixed(2)}KB`);

  // Binary search for optimal quality
  let lowQuality = 5;
  let highQuality = 95;
  let closestMatch = null; // Closest to target but under it
  let allResults = [];

  // First pass: find the range
  const testQualities = [90, 70, 50, 30, 10];
  for (const quality of testQualities) {
    try {
      const tempPath = filePath + `.q${quality}.${ext}`;
      let transform = sharp(filePath);

      if (ext === 'jpg' || ext === 'jpeg') {
        transform = transform.jpeg({ quality, progressive: true });
      } else if (ext === 'webp') {
        transform = transform.webp({ quality });
      } else if (ext === 'png') {
        transform = transform.png({ compressionLevel: 9 });
      }

      await transform.toFile(tempPath);

      if (fs.existsSync(tempPath)) {
        const size = fs.statSync(tempPath).size;
        console.log(`   Quality ${quality}: ${(size / 1024).toFixed(2)}KB`);
        allResults.push({ quality, size, path: tempPath });

        if (size <= targetBytes) {
          // Under target - is it closer than previous best?
          if (!closestMatch || size > closestMatch.size) {
            closestMatch = { quality, size, path: tempPath };
          }
          // If within 5% of target, good enough
          if (size >= targetBytes * 0.95) {
            break;
          }
        }
      }
    } catch (e) {
      console.error(`Error at quality ${quality}:`, e.message);
    }
  }

  // If we found a match under target, try to fine-tune
  if (closestMatch) {
    // Try higher qualities to get closer to target
    const idx = testQualities.indexOf(closestMatch.quality);
    if (idx > 0) {
      const higherQuality = testQualities[idx - 1];
      // Binary search between closestMatch.quality and higherQuality
      let lo = closestMatch.quality;
      let hi = higherQuality;

      while (hi - lo > 5) {
        const mid = Math.round((lo + hi) / 2);
        try {
          const tempPath = filePath + `.q${mid}.${ext}`;
          let transform = sharp(filePath);

          if (ext === 'jpg' || ext === 'jpeg') {
            transform = transform.jpeg({ quality: mid, progressive: true });
          } else if (ext === 'webp') {
            transform = transform.webp({ quality: mid });
          } else if (ext === 'png') {
            transform = transform.png({ compressionLevel: 9 });
          }

          await transform.toFile(tempPath);

          if (fs.existsSync(tempPath)) {
            const size = fs.statSync(tempPath).size;
            console.log(`   Quality ${mid}: ${(size / 1024).toFixed(2)}KB`);
            allResults.push({ quality: mid, size, path: tempPath });

            if (size <= targetBytes && size > closestMatch.size) {
              closestMatch = { quality: mid, size, path: tempPath };
              lo = mid;
            } else {
              hi = mid;
            }
          }
        } catch (e) {
          hi = mid;
        }
      }
    }
  }

  // Clean up temp files and use best result
  for (const result of allResults) {
    if (closestMatch && result.path === closestMatch.path) continue;
    try { fs.unlinkSync(result.path); } catch (e) {}
  }

  if (closestMatch) {
    fs.renameSync(closestMatch.path, outputPath);
    const percentage = ((closestMatch.size / targetBytes) * 100).toFixed(1);
    console.log(`✅ Image compressed: ${(originalSize / 1024).toFixed(2)}KB -> ${(closestMatch.size / 1024).toFixed(2)}KB (${percentage}% of target)`);
    return outputPath;
  }

  // No result under target - return the smallest we could get
  if (allResults.length > 0) {
    allResults.sort((a, b) => a.size - b.size);
    const smallest = allResults[0];
    for (let i = 1; i < allResults.length; i++) {
      try { fs.unlinkSync(allResults[i].path); } catch (e) {}
    }
    fs.renameSync(smallest.path, outputPath);
    console.log(`⚠️ Image compressed to smallest: ${(originalSize / 1024).toFixed(2)}KB -> ${(smallest.size / 1024).toFixed(2)}KB`);
    console.log(`   (Could not reach target ${(targetBytes / 1024).toFixed(2)}KB)`);
    return outputPath;
  }

  return filePath;
}

module.exports = { convertFile, checkFileSizeLimit, compressImageToTargetSize, compressToTargetSize };
