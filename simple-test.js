const http = require('http');

console.log('Testing QuickText Pro server...');

const testData = JSON.stringify({
    content: 'Simple test message',
    contentType: 'text',
    duration: '5m'
});

const options = {
    hostname: 'localhost',
    port: 3000,
    path: '/api/share',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': testData.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
        data += chunk;
    });
    
    res.on('end', () => {
        try {
            const result = JSON.parse(data);
            console.log('✅ Share created successfully:', result.code);
            console.log('✅ Server is working correctly!');
        } catch (e) {
            console.log('Response:', data);
        }
    });
});

req.on('error', (error) => {
    console.error('❌ Error:', error.message);
});

req.write(testData);
req.end();
