#!/usr/bin/env node

/**
 * Quick Server Test
 */

const http = require('http');

function testServer() {
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/api/health',
        method: 'GET'
    };

    console.log('Testing server health...');
    
    const req = http.request(options, (res) => {
        let data = '';
        
        console.log(`Status: ${res.statusCode}`);
        
        res.on('data', chunk => {
            data += chunk;
        });
        
        res.on('end', () => {
            try {
                const parsed = JSON.parse(data);
                console.log('✅ Server Response:', parsed);
            } catch (err) {
                console.log('Raw Response:', data);
            }
            process.exit(0);
        });
    });

    req.on('error', (err) => {
        console.error('❌ Connection Error:', err.message);
        console.error('Make sure server is running on port 3000');
        process.exit(1);
    });

    req.on('timeout', () => {
        console.error('❌ Request Timeout');
        req.destroy();
        process.exit(1);
    });

    req.setTimeout(5000);
    req.end();
}

testServer();
