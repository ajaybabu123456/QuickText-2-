// Test script for the serverless API function
const apiHandler = require('./api/index.js');

// Mock request and response objects
function createMockReq(method, url, body = null) {
    const req = {
        method,
        url,
        headers: {
            'content-type': 'application/json',
            'host': 'localhost:3000',
            'x-forwarded-for': '127.0.0.1'
        }
    };

    // Simulate request body streaming for POST requests
    if (body && method === 'POST') {
        const bodyStr = JSON.stringify(body);
        let dataEmitted = false;
        
        req.on = (event, callback) => {
            if (event === 'data' && !dataEmitted) {
                dataEmitted = true;
                setTimeout(() => callback(bodyStr), 10);
            } else if (event === 'end') {
                setTimeout(callback, 20);
            }
        };
    } else {
        req.on = (event, callback) => {
            if (event === 'end') {
                setTimeout(callback, 10);
            }
        };
    }

    return req;
}

function createMockRes() {
    const res = {
        statusCode: 200,
        headers: {},
        body: '',
        
        setHeader(name, value) {
            this.headers[name] = value;
        },
        
        status(code) {
            this.statusCode = code;
            return this;
        },
        
        json(data) {
            this.body = JSON.stringify(data);
            return this;
        },
        
        end(data) {
            if (data) this.body = data;
            return this;
        }
    };
    
    return res;
}

async function testAPI() {
    console.log('🧪 Testing Serverless API Function...\n');

    // Test 1: Health Check
    console.log('1. Testing Health Check...');
    try {
        const req = createMockReq('GET', '/health');
        const res = createMockRes();
        
        await apiHandler(req, res);
        
        if (res.statusCode === 200) {
            console.log('✅ Health check passed');
            console.log('Response:', res.body);
        } else {
            console.log('❌ Health check failed:', res.statusCode);
        }
    } catch (error) {
        console.log('❌ Health check error:', error.message);
    }

    // Test 2: Create Share
    console.log('\n2. Testing Share Creation...');
    let shareCode = null;
    try {
        const shareData = {
            content: 'Hello, this is a test message!',
            contentType: 'text',
            duration: '15m'
        };
        
        const req = createMockReq('POST', '/api/share', shareData);
        const res = createMockRes();
        
        await apiHandler(req, res);
        
        if (res.statusCode === 200) {
            const result = JSON.parse(res.body);
            shareCode = result.code;
            console.log('✅ Share creation passed');
            console.log('Generated Code:', shareCode);
        } else {
            console.log('❌ Share creation failed:', res.statusCode, res.body);
        }
    } catch (error) {
        console.log('❌ Share creation error:', error.message);
    }

    // Test 3: Retrieve Share
    if (shareCode) {
        console.log('\n3. Testing Share Retrieval...');
        try {
            const req = createMockReq('GET', `/api/share/${shareCode}`);
            const res = createMockRes();
            
            await apiHandler(req, res);
            
            if (res.statusCode === 200) {
                const result = JSON.parse(res.body);
                console.log('✅ Share retrieval passed');
                console.log('Retrieved Content:', result.content);
                console.log('Views:', result.currentViews);
            } else {
                console.log('❌ Share retrieval failed:', res.statusCode, res.body);
            }
        } catch (error) {
            console.log('❌ Share retrieval error:', error.message);
        }
    }

    // Test 4: Password Protected Share
    console.log('\n4. Testing Password Protected Share...');
    try {
        const shareData = {
            content: 'This is a secret message!',
            contentType: 'text',
            password: 'test123',
            duration: '15m'
        };
        
        const req = createMockReq('POST', '/api/share', shareData);
        const res = createMockRes();
        
        await apiHandler(req, res);
        
        if (res.statusCode === 200) {
            const result = JSON.parse(res.body);
            const protectedCode = result.code;
            console.log('✅ Password protected share created:', protectedCode);

            // Test retrieval without password
            const req2 = createMockReq('GET', `/api/share/${protectedCode}`);
            const res2 = createMockRes();
            await apiHandler(req2, res2);
            
            if (res2.statusCode === 401) {
                console.log('✅ Password protection working (401 without password)');
                
                // Test with correct password
                const req3 = createMockReq('GET', `/api/share/${protectedCode}?password=test123`);
                const res3 = createMockRes();
                await apiHandler(req3, res3);
                
                if (res3.statusCode === 200) {
                    console.log('✅ Password authentication working');
                } else {
                    console.log('❌ Password authentication failed:', res3.statusCode);
                }
            } else {
                console.log('❌ Password protection not working:', res2.statusCode);
            }
        }
    } catch (error) {
        console.log('❌ Password protected share error:', error.message);
    }

    console.log('\n🏁 API Testing Complete!');
}

// Run the tests
testAPI().catch(console.error);
