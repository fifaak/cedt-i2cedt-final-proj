#!/usr/bin/env node

const https = require('https');
const http = require('http');

// Test backend health
function testBackend() {
    return new Promise((resolve, reject) => {
        const req = http.request('http://localhost:3001/api/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Backend timeout'));
        });
        req.end();
    });
}

// Test frontend health
function testFrontend() {
    return new Promise((resolve, reject) => {
        const req = http.request('http://localhost:3000/health', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });
        req.on('error', reject);
        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Frontend timeout'));
        });
        req.end();
    });
}

// Test API call
function testAPI() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            message: "ทดสอบการเชื่อมต่อ",
            userInfo: {
                name: "ทดสอบ",
                birthdate: "01/01/1990",
                sex: "male",
                topic: "overall"
            }
        });

        const options = {
            hostname: 'localhost',
            port: 3001,
            path: '/api/chat',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    resolve(result);
                } catch (e) {
                    reject(e);
                }
            });
        });

        req.on('error', reject);
        req.setTimeout(10000, () => {
            req.destroy();
            reject(new Error('API timeout'));
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('🧪 Testing Thai Fortune App Connection...\n');

    // Test Backend
    try {
        console.log('🔮 Testing Backend (port 3001)...');
        const backendResult = await testBackend();
        console.log('✅ Backend OK:', backendResult.status);
        console.log('   Storage:', backendResult.storage.type, '-', backendResult.storage.status);
        console.log('   Node:', backendResult.nodeVersion);
    } catch (error) {
        console.log('❌ Backend Error:', error.message);
        return;
    }

    // Test Frontend
    try {
        console.log('\n🌐 Testing Frontend (port 3000)...');
        const frontendResult = await testFrontend();
        console.log('✅ Frontend OK:', frontendResult.status);
    } catch (error) {
        console.log('❌ Frontend Error:', error.message);
        return;
    }

    // Test API
    try {
        console.log('\n🤖 Testing AI API...');
        const apiResult = await testAPI();
        console.log('✅ API OK - Response received');
        console.log('   Prediction length:', apiResult.prediction.length, 'characters');
    } catch (error) {
        console.log('❌ API Error:', error.message);
        return;
    }

    console.log('\n🎉 All tests passed! Your Thai Fortune App is ready to use.');
    console.log('🌐 Open http://localhost:3000 in your browser');
}

runTests().catch(console.error);