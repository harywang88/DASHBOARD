const { PDFDocument, rgb } = require('pdf-lib');
const fs = require('fs').promises;
const path = require('path');
const pdfParse = require('pdf-parse');

// Extract text from PDF dengan detail per-page dan text positioning
async function extractTextFromPDF(filePath) {
    try {
        const pdfBuffer = await fs.readFile(filePath);
        const pdf = await pdfParse(pdfBuffer);
        
        const pages = [];
        const totalPages = pdf.numpages || 1;
        
        console.log(`Extracting text from ${totalPages} pages`);
        
        // Extract text per page dengan parsing yang lebih baik
        const textLines = pdf.text.split('\n\n---\n\n'); // Separator antar halaman
        let pageIndex = 0;
        
        for (let p = 1; p <= totalPages; p++) {
            const pageText = textLines[pageIndex] || '';
            const lines = pageText.split('\n').filter(line => line.trim());
            
            pages.push({
                pageNumber: p,
                text: pageText.trim(),
                lines: lines,
                lineCount: lines.length,
                items: extractTextItems(pageText, p)
            });
            
            pageIndex++;
        }

        console.log(`✓ Extracted text from ${pages.length} pages`);
        return pages;
    } catch (error) {
        console.error('Extract text error:', error.message);
        // Return empty pages on error
        return [{
            pageNumber: 1,
            text: '',
            lines: [],
            items: [],
            error: error.message
        }];
    }
}

// Extract text items dengan posisi perkiraan
function extractTextItems(text, pageNum = 1) {
    try {
        const items = [];
        const lines = text.split('\n');
        let yPos = 50; // Initial Y position
        
        lines.forEach((line, idx) => {
            if (line.trim()) {
                const words = line.split(/\s+/);
                let xPos = 50;
                
                words.forEach(word => {
                    if (word) {
                        items.push({
                            str: word,
                            x: xPos,
                            y: yPos,
                            width: word.length * 6, // Estimate width
                            height: 12,
                            fontName: 'Helvetica',
                            size: 12,
                            page: pageNum
                        });
                        xPos += (word.length * 6) + 8;
                    }
                });
                yPos += 20; // Line spacing
            }
        });
        
        return items;
    } catch (error) {
        console.warn('Extract items error:', error.message);
        return [];
    }
}

// Advanced text extraction with position information
async function extractTextWithPositions(filePath) {
    try {
        const pdfBuffer = await fs.readFile(filePath);
        const pdf = await pdfParse(pdfBuffer);
        
        const items = [];
        // Extract text with metadata
        if (pdf.items && Array.isArray(pdf.items)) {
            pdf.items.forEach(item => {
                if (item.str && item.str.trim()) {
                    items.push({
                        text: item.str,
                        x: item.x,
                        y: item.y,
                        width: item.width,
                        height: item.height,
                        fontName: item.fontName,
                        size: item.height
                    });
                }
            });
        }
        return items;
    } catch (error) {
        console.warn('Advanced extraction failed, falling back to simple extraction:', error.message);
        return [];
    }
}

// Edit PDF - Find and replace text, or add new text
async function editPDF(filePath, options) {
    try {
        console.log(`Editing PDF: ${filePath}`, options);
        
        const { 
            page = 1, 
            text = '', 
            fontSize = 12, 
            color = '#000000',
            findText = '',
            replaceText = '',
            editMode = 'add' // 'add', 'replace', 'replaceBox', or 'batch'
        } = options;

        // Load the PDF
        const pdfBuffer = await fs.readFile(filePath);
        const pdf = await PDFDocument.load(pdfBuffer);
        
        const pageCount = pdf.getPageCount();
        console.log(`Total pages: ${pageCount}, editing page: ${page}`);
        
        if (page > pageCount || page < 1) {
            throw new Error(`Halaman ${page} tidak ada. Total halaman: ${pageCount}`);
        }

        // Get the page
        const pages = pdf.getPages();
        const selectedPage = pages[page - 1];

        // Convert color from hex to RGB
        const [r, g, b] = hexToRgb(color);

        // Mode 1: Add text to page
        if (editMode === 'add' && text) {
            selectedPage.drawText(text, {
                x: 50,
                y: selectedPage.getHeight() - 50,
                size: fontSize,
                color: rgb(r / 255, g / 255, b / 255)
            });
        }

        // Mode 2: Replace text (requires regenerating PDF with replaced text)
        if (editMode === 'replace' && findText && replaceText) {
            console.log(`Replacing "${findText}" with "${replaceText}"`);
            // Note: Full text replacement requires more advanced PDF manipulation
            // For now, we'll add a note about the replacement
        }

        // New Mode: replaceBox - overlay a white rectangle then draw replacement text
        if (editMode === 'replaceBox') {
            const { x = 0, y = 0, width = 0, height = 0, canvasWidth = 0, canvasHeight = 0, fontFamily = 'Helvetica' } = options;
            const pdfWidth = selectedPage.getWidth();
            const pdfHeight = selectedPage.getHeight();
            const scaleX = pdfWidth / (parseFloat(canvasWidth) || pdfWidth);
            const scaleY = pdfHeight / (parseFloat(canvasHeight) || pdfHeight);
            const rectX = (parseFloat(x) || 0) * scaleX;
            const rectWidth = (parseFloat(width) || 0) * scaleX;
            const rectHeight = (parseFloat(height) || 0) * scaleY;
            const rectTop = parseFloat(y) || 0;
            const rectY = pdfHeight - ((rectTop + (parseFloat(height) || 0)) * scaleY);
            selectedPage.drawRectangle({ x: rectX, y: rectY, width: rectWidth, height: rectHeight, color: rgb(1, 1, 1) });
            let fontToUse = null;
            try {
                const { StandardFonts } = require('pdf-lib');
                if (String(fontFamily).toLowerCase().includes('times')) fontToUse = await pdf.embedFont(StandardFonts.TimesRoman);
                else if (String(fontFamily).toLowerCase().includes('courier')) fontToUse = await pdf.embedFont(StandardFonts.Courier);
                else fontToUse = await pdf.embedFont(StandardFonts.Helvetica);
            } catch (e) {
                try { fontToUse = await pdf.embedFont('Helvetica'); } catch (_) { fontToUse = null; }
            }
            if (text) {
                const drawSize = parseFloat(fontSize) || 12;
                const textX = rectX + 2;
                const textY = rectY + rectHeight - drawSize - 2;
                selectedPage.drawText(String(text), { x: textX, y: textY, size: drawSize, font: fontToUse, color: rgb(r / 255, g / 255, b / 255), maxWidth: rectWidth - 4 });
            }
        }

        // Batch edits (edits array) - apply multiple replaceBox edits with intelligent positioning
        if (editMode === 'batch' && options.edits) {
            let edits = options.edits;
            if (typeof edits === 'string') {
                try { edits = JSON.parse(edits); } catch (e) { edits = []; }
            }
            if (Array.isArray(edits) && edits.length > 0) {
                console.log(`Applying ${edits.length} batch edits`);
                for (const ed of edits) {
                    try {
                        const pageIdx = parseInt(ed.page) || page;
                        const pagesArr = pdf.getPages();
                        if (pageIdx < 1 || pageIdx > pagesArr.length) {
                            console.warn(`Skipping edit: page ${pageIdx} out of range`);
                            continue;
                        }
                        const p = pagesArr[pageIdx - 1];
                        const pdfW = p.getWidth();
                        const pdfH = p.getHeight();
                        
                        // Scaling factors untuk convert canvas coordinates to PDF coordinates
                        const sX = pdfW / (parseFloat(ed.canvasWidth) || pdfW);
                        const sY = pdfH / (parseFloat(ed.canvasHeight) || pdfH);
                        
                        // Calculate rectangle position - convert dari canvas space ke PDF space
                        const rX = (parseFloat(ed.x) || 0) * sX;
                        const rW = (parseFloat(ed.width) || 0) * sX;
                        const rH = (parseFloat(ed.height) || 0) * sY;
                        const rTop = parseFloat(ed.y) || 0;
                        const rY = pdfH - ((rTop + (parseFloat(ed.height) || 0)) * sY);
                        
                        // Validate dimensions
                        if (rW <= 0 || rH <= 0) {
                            console.warn(`Skipping edit: invalid dimensions (width=${rW}, height=${rH})`);
                            continue;
                        }
                        
                        // Draw white rectangle untuk cover teks lama
                        p.drawRectangle({ 
                            x: rX, 
                            y: rY, 
                            width: rW, 
                            height: rH, 
                            color: rgb(1, 1, 1),
                            opacity: 1
                        });
                        
                        // Embed font dengan fallback options
                        let fnt = null;
                        try {
                            const { StandardFonts } = require('pdf-lib');
                            const fontFamily = String(ed.fontFamily || '').toLowerCase();
                            if (fontFamily.includes('times')) {
                                fnt = await pdf.embedFont(StandardFonts.TimesRoman);
                            } else if (fontFamily.includes('courier')) {
                                fnt = await pdf.embedFont(StandardFonts.Courier);
                            } else if (fontFamily.includes('bold')) {
                                fnt = await pdf.embedFont(StandardFonts.HelveticaBold);
                            } else {
                                fnt = await pdf.embedFont(StandardFonts.Helvetica);
                            }
                        } catch (fontErr) {
                            console.warn('Font embedding failed, using Helvetica:', fontErr.message);
                            try {
                                const { StandardFonts } = require('pdf-lib');
                                fnt = await pdf.embedFont(StandardFonts.Helvetica);
                            } catch (_) {
                                fnt = null;
                            }
                        }
                        
                        // Draw teks baru dengan word wrapping support
                        if (ed.text) {
                            const textContent = String(ed.text);
                            const drawSize = parseFloat(ed.fontSize) || 12;
                            const textX = rX + 2;
                            const textY = rY + rH - drawSize - 2;
                            const maxWidth = rW - 4;
                            
                            const textColor = ed.color ? hexToRgb(ed.color) : [0, 0, 0];
                            p.drawText(textContent, { 
                                x: textX, 
                                y: textY, 
                                size: drawSize, 
                                font: fnt, 
                                color: rgb(textColor[0] / 255, textColor[1] / 255, textColor[2] / 255),
                                maxWidth: maxWidth,
                                lineHeight: drawSize + 2
                            });
                            console.log(`Applied edit on page ${pageIdx}: "${textContent}"`);
                        }
                    } catch (errEd) {
                        console.warn('Failed applying edit:', errEd.message);
                        continue;
                    }
                }
            }
        }

        // Overlays: embed per-page overlay PNGs ke dalam PDF (untuk draw/text objects)
        if (options.overlays && Array.isArray(options.overlays) && options.overlays.length) {
            console.log(`Processing ${options.overlays.length} overlay images`);
            for (const ov of options.overlays) {
                try {
                    // Parse filename untuk extract page number dan canvas dimensions
                    // Format: overlay-page-{pageNum}-cw-{canvasWidth}-ch-{canvasHeight}.png
                    const filenameMatch = /overlay-page-(\d+)-cw-(\d+)-ch-(\d+)\.png/i.exec(ov.originalname || ov.path || '');
                    const pageIdx = filenameMatch ? parseInt(filenameMatch[1], 10) : null;
                    const canvasWidth = filenameMatch ? parseInt(filenameMatch[2], 10) : null;
                    const canvasHeight = filenameMatch ? parseInt(filenameMatch[3], 10) : null;
                    
                    if (!pageIdx || !canvasWidth || !canvasHeight) {
                        console.warn(`Skipping overlay: invalid filename format - ${ov.originalname}`);
                        continue;
                    }
                    
                    const pagesArr = pdf.getPages();
                    if (pageIdx < 1 || pageIdx > pagesArr.length) {
                        console.warn(`Skipping overlay: page ${pageIdx} out of range`);
                        continue;
                    }
                    
                    const p = pagesArr[pageIdx - 1];
                    const pdfW = p.getWidth();
                    const pdfH = p.getHeight();
                    
                    // Read image bytes
                    const imgBytes = await fs.readFile(ov.path);
                    let embeddedImg = null;
                    
                    try {
                        embeddedImg = await pdf.embedPng(imgBytes);
                    } catch (pngErr) {
                        try {
                            embeddedImg = await pdf.embedJpg(imgBytes);
                        } catch (jpgErr) {
                            console.warn(`Skipping overlay - unsupported format: ${ov.originalname}`);
                            embeddedImg = null;
                        }
                    }
                    
                    if (embeddedImg) {
                        // Scale overlay ke PDF page dimensions
                        const scaleX = pdfW / canvasWidth;
                        const scaleY = pdfH / canvasHeight;
                        
                        p.drawImage(embeddedImg, { 
                            x: 0, 
                            y: 0, 
                            width: pdfW, 
                            height: pdfH
                        });
                        console.log(`Applied overlay on page ${pageIdx}`);
                    }
                    
                    // Delete overlay file setelah digunakan
                    try {
                        await fs.unlink(ov.path);
                    } catch (unlinkErr) {
                        console.warn(`Could not delete overlay file: ${ov.path}`);
                    }
                } catch (errOv) {
                    console.warn('Failed to apply overlay:', errOv.message);
                    continue;
                }
            }
        }

        // Save the output PDF dengan error handling yang baik
        const outputFileName = `edited-${Date.now()}.pdf`;
        const outputPath = path.join(__dirname, '../output', outputFileName);
        
        let pdfOutputBuffer = null;
        try {
            pdfOutputBuffer = await pdf.save();
            await fs.writeFile(outputPath, pdfOutputBuffer);
            console.log('✓ PDF saved successfully:', outputPath, `(${Math.round(pdfOutputBuffer.length / 1024)}KB)`);
        } catch (saveErr) {
            console.error('Error saving PDF:', saveErr.message);
            throw new Error(`Gagal menyimpan PDF: ${saveErr.message}`);
        }

        // Delete input file
        try {
            await fs.unlink(filePath);
            console.log('✓ Input file deleted:', filePath);
        } catch (unlinkErr) {
            console.warn(`Warning: Could not delete input file ${filePath}:`, unlinkErr.message);
        }

        console.log('✓ PDF editing completed successfully');
        return {
            file: outputFileName,
            path: outputPath,
            message: 'PDF berhasil diedit',
            size: pdfOutputBuffer?.length || 0,
            timestamp: new Date().toISOString()
        };
    } catch (error) {
        console.error('Edit error:', error);
        // Cleanup on error
        try { await fs.unlink(filePath); } catch (e) { }
        throw new Error(`Gagal mengedit PDF: ${error.message}`);
    }
}

// Convert hex color to RGB array dengan support berbagai format
function hexToRgb(hex) {
    const cleanHex = String(hex || '#000000').replace(/^#/, '');
    let r, g, b;
    
    if (cleanHex.length === 3) {
        // Expand 3-char hex to 6-char
        r = parseInt(cleanHex[0] + cleanHex[0], 16);
        g = parseInt(cleanHex[1] + cleanHex[1], 16);
        b = parseInt(cleanHex[2] + cleanHex[2], 16);
    } else {
        r = parseInt(cleanHex.substring(0, 2), 16) || 0;
        g = parseInt(cleanHex.substring(2, 4), 16) || 0;
        b = parseInt(cleanHex.substring(4, 6), 16) || 0;
    }
    
    return [r, g, b];
}

module.exports = { editPDF, extractTextFromPDF, hexToRgb };
