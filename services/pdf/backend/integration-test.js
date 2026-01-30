/**
 * Integration Test untuk PDF Editor
 * Simulasi real-world usage scenarios
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

const API_URL = 'http://localhost:3000/api';

console.log('🧪 PDF Editor Integration Tests\n');

// Test 1: Health Check
async function testHealthCheck() {
    console.log('Test 1: Health Check');
    try {
        const response = await fetch('http://localhost:3000/api/health');
        const data = await response.json();
        console.log('✅ Server is running:', data.status);
        return true;
    } catch (e) {
        console.log('❌ Server is not running:', e.message);
        return false;
    }
}

// Test 2: Create sample PDF untuk testing
async function createSamplePDF() {
    console.log('\nTest 2: Creating Sample PDF for Testing');
    try {
        const { PDFDocument } = require('pdf-lib');
        const pdf = await PDFDocument.create();
        const page = pdf.addPage();
        
        page.drawText('Sample PDF Document', { x: 50, y: 500, size: 20 });
        page.drawText('This is test content', { x: 50, y: 450, size: 12 });
        page.drawText('For testing PDF editing features', { x: 50, y: 430, size: 12 });
        
        // Add second page
        const page2 = pdf.addPage();
        page2.drawText('Page 2 Content', { x: 50, y: 500, size: 20 });
        page2.drawText('Multi-page PDF test', { x: 50, y: 450, size: 12 });
        
        const pdfBytes = await pdf.save();
        const testPdfPath = path.join(__dirname, 'test-sample.pdf');
        fs.writeFileSync(testPdfPath, pdfBytes);
        
        console.log('✅ Sample PDF created:', testPdfPath);
        return testPdfPath;
    } catch (e) {
        console.log('❌ Failed to create sample PDF:', e.message);
        return null;
    }
}

// Test 3: Text Extraction
async function testTextExtraction(pdfPath) {
    console.log('\nTest 3: Text Extraction API');
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(pdfPath));
        
        const response = await fetch(`${API_URL}/extract-text`, {
            method: 'POST',
            body: form
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Text extracted successfully');
            console.log(`   - Pages: ${data.totalPages}`);
            console.log(`   - Page 1 text: ${data.pages[0].text.substring(0, 50)}...`);
            return true;
        } else {
            console.log('❌ Extraction failed:', data.error);
            return false;
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
        return false;
    }
}

// Test 4: Add Text
async function testAddText(pdfPath) {
    console.log('\nTest 4: Add Text to PDF');
    try {
        const form = new FormData();
        form.append('file', fs.createReadStream(pdfPath));
        form.append('editMode', 'add');
        form.append('text', 'NEWLY ADDED TEXT');
        form.append('fontSize', '16');
        form.append('color', '#FF0000');
        
        const response = await fetch(`${API_URL}/edit`, {
            method: 'POST',
            body: form
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Text added successfully');
            console.log(`   - Output file: ${data.file}`);
            return true;
        } else {
            console.log('❌ Add text failed:', data.error);
            return false;
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
        return false;
    }
}

// Test 5: Batch Edit
async function testBatchEdit(pdfPath) {
    console.log('\nTest 5: Batch Edit (Multiple Edits)');
    try {
        const edits = [
            {
                page: 1,
                x: 50,
                y: 350,
                width: 300,
                height: 40,
                text: 'EDITED: Changed Text',
                fontSize: 14,
                color: '#0000FF',
                fontFamily: 'Helvetica',
                canvasWidth: 800,
                canvasHeight: 600
            }
        ];
        
        const form = new FormData();
        form.append('file', fs.createReadStream(pdfPath));
        form.append('editMode', 'batch');
        form.append('edits', JSON.stringify(edits));
        
        const response = await fetch(`${API_URL}/edit`, {
            method: 'POST',
            body: form
        });
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Batch edit successful');
            console.log(`   - Edits applied: 1`);
            console.log(`   - Output file: ${data.file}`);
            return true;
        } else {
            console.log('❌ Batch edit failed:', data.error);
            return false;
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
        return false;
    }
}

// Test 6: Multiple Language Support
async function testMultiLanguage(pdfPath) {
    console.log('\nTest 6: Multi-Language Text Support');
    try {
        const texts = [
            'Hello World (English)',
            'Halo Dunia (Indonesian)',
            '你好世界 (Chinese)',
            'مرحبا بالعالم (Arabic)'
        ];
        
        let allPassed = true;
        for (const text of texts) {
            const form = new FormData();
            form.append('file', fs.createReadStream(pdfPath));
            form.append('editMode', 'add');
            form.append('text', text);
            form.append('fontSize', '12');
            form.append('color', '#000000');
            
            const response = await fetch(`${API_URL}/edit`, {
                method: 'POST',
                body: form
            });
            
            const data = await response.json();
            if (!data.success) {
                allPassed = false;
                console.log(`  ⚠️  ${text.substring(0, 20)}: ${data.error}`);
            } else {
                console.log(`  ✅ ${text.substring(0, 20)}`);
            }
        }
        
        return allPassed ? '✅ Multi-language test completed' : '⚠️  Some language tests failed';
    } catch (e) {
        console.log('❌ Error:', e.message);
        return false;
    }
}

// Test 7: Large Batch Edit
async function testLargeBatchEdit(pdfPath) {
    console.log('\nTest 7: Large Batch Edit (50 edits)');
    try {
        const edits = [];
        for (let i = 0; i < 50; i++) {
            edits.push({
                page: 1,
                x: 50 + (i % 10) * 50,
                y: 200 + Math.floor(i / 10) * 30,
                width: 40,
                height: 20,
                text: `Edit ${i+1}`,
                fontSize: 8,
                color: '#000000',
                fontFamily: 'Helvetica',
                canvasWidth: 800,
                canvasHeight: 600
            });
        }
        
        const form = new FormData();
        form.append('file', fs.createReadStream(pdfPath));
        form.append('editMode', 'batch');
        form.append('edits', JSON.stringify(edits));
        
        const startTime = Date.now();
        const response = await fetch(`${API_URL}/edit`, {
            method: 'POST',
            body: form
        });
        const duration = Date.now() - startTime;
        
        const data = await response.json();
        if (data.success) {
            console.log('✅ Large batch edit successful');
            console.log(`   - Edits applied: ${edits.length}`);
            console.log(`   - Time taken: ${duration}ms`);
            console.log(`   - Performance: ${(edits.length / (duration / 1000)).toFixed(1)} edits/sec`);
            return true;
        } else {
            console.log('❌ Large batch edit failed:', data.error);
            return false;
        }
    } catch (e) {
        console.log('❌ Error:', e.message);
        return false;
    }
}

// Test 8: Color Support
async function testColorSupport(pdfPath) {
    console.log('\nTest 8: Color Support (RGB/Hex)');
    try {
        const colors = [
            '#FF0000',  // Red
            '#00FF00',  // Green  
            '#0000FF',  // Blue
            '#FFFF00',  // Yellow
            '#FF00FF',  // Magenta
            '#00FFFF'   // Cyan
        ];
        
        let allPassed = true;
        for (const color of colors) {
            const form = new FormData();
            form.append('file', fs.createReadStream(pdfPath));
            form.append('editMode', 'add');
            form.append('text', `Color: ${color}`);
            form.append('fontSize', '12');
            form.append('color', color);
            
            const response = await fetch(`${API_URL}/edit`, {
                method: 'POST',
                body: form
            });
            
            const data = await response.json();
            if (!data.success) {
                allPassed = false;
                console.log(`  ⚠️  ${color}: ${data.error}`);
            } else {
                console.log(`  ✅ ${color}`);
            }
        }
        
        return allPassed;
    } catch (e) {
        console.log('❌ Error:', e.message);
        return false;
    }
}

// Test 9: Error Handling
async function testErrorHandling() {
    console.log('\nTest 9: Error Handling');
    try {
        // Test invalid file
        console.log('  Testing invalid file...');
        const form = new FormData();
        form.append('file', Buffer.from('not a pdf'));
        
        const response = await fetch(`${API_URL}/edit`, {
            method: 'POST',
            body: form
        });
        
        if (response.status === 400 || response.status === 500) {
            console.log('  ✅ Error handling works (returns error status)');
            return true;
        }
    } catch (e) {
        console.log('  ✅ Error handling works:', e.message);
        return true;
    }
}

// Main test runner
async function runAllTests() {
    console.log('═══════════════════════════════════════════════════════════\n');
    
    // Check if server is running
    const serverRunning = await testHealthCheck();
    if (!serverRunning) {
        console.log('\n❌ Tests cannot run - server is not available');
        console.log('Start server with: npm start\n');
        return;
    }
    
    // Create sample PDF
    const pdfPath = await createSamplePDF();
    if (!pdfPath) {
        console.log('\n❌ Cannot create test PDF\n');
        return;
    }
    
    // Run all tests
    const results = [];
    results.push(await testTextExtraction(pdfPath));
    results.push(await testAddText(pdfPath));
    results.push(await testBatchEdit(pdfPath));
    results.push(await testMultiLanguage(pdfPath));
    results.push(await testLargeBatchEdit(pdfPath));
    results.push(await testColorSupport(pdfPath));
    results.push(await testErrorHandling());
    
    // Cleanup
    try {
        fs.unlinkSync(pdfPath);
    } catch (e) { }
    
    // Summary
    console.log('\n═══════════════════════════════════════════════════════════');
    const passed = results.filter(r => r).length;
    const total = results.length;
    console.log(`\n📊 Test Results: ${passed}/${total} passed`);
    
    if (passed === total) {
        console.log('✅ All tests passed!\n');
    } else {
        console.log(`⚠️  ${total - passed} test(s) failed\n`);
    }
}

// Run tests
runAllTests().catch(e => {
    console.error('Fatal error:', e);
    process.exit(1);
});
