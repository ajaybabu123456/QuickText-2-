// Modern API Test Suite for QuickText Pro
const handler = require('./api/index.js');

function createMockReq(method, url, body = null) {
    const req = {
        method,
        url,
        headers: {
            'content-type': 'application/json',
            'host': 'localhost:3000',
            'x-forwarded-for': '127.0.0.1'
        },
        connection: { remoteAddress: '127.0.0.1' },
        body,
        on(event, callback) {
            if (event === 'data' && body) callback(Buffer.from(JSON.stringify(body)));
            if (event === 'end') callback();
            return this;
        }
    };
    return req;
}

function createMockRes() {
    const res = {
        statusCode: 200,
        headers: {},
        body: '',
        setHeader(key, value) { this.headers[key] = value; },
        status(code) { this.statusCode = code; return this; },
        json(data) { this.body = JSON.stringify(data); this.headers['content-type'] = 'application/json'; return this; },
        write(data) { this.body += data; return this; },
        end() { return this; }
    };
    return res;
}

async function runTest(title, fn) {
    try {
        await fn();
        console.log(`✅ ${title}`);
    } catch (err) {
        console.error(`❌ ${title}`);
        console.error(err);
    }
}

async function testShareLifecycle() {
    // Create
    const createReq = createMockReq('POST', '/api/share', {
        content: 'API test content',
        contentType: 'text',
        duration: '15m'
    });
    const createRes = createMockRes();
    await handler(createReq, createRes);
    if (createRes.statusCode !== 200) throw new Error('Share creation failed');
    const share = JSON.parse(createRes.body);
    if (!share.code) throw new Error('No code returned');

    // Retrieve
    const retrieveReq = createMockReq('GET', `/api/share/${share.code}`);
    const retrieveRes = createMockRes();
    await handler(retrieveReq, retrieveRes);
    if (retrieveRes.statusCode !== 200) throw new Error('Share retrieval failed');
    const retrieved = JSON.parse(retrieveRes.body);
    if (retrieved.content !== 'API test content') throw new Error('Content mismatch');

    // Update
    const updateReq = createMockReq('PUT', `/api/share/${share.code}`, {
        content: 'Updated content',
        contentType: 'text'
    });
    const updateRes = createMockRes();
    await handler(updateReq, updateRes);
    if (updateRes.statusCode !== 200) throw new Error('Share update failed');

    // Verify update
    const verifyReq = createMockReq('GET', `/api/share/${share.code}`);
    const verifyRes = createMockRes();
    await handler(verifyReq, verifyRes);
    const updated = JSON.parse(verifyRes.body);
    if (updated.content !== 'Updated content') throw new Error('Update not reflected');
}

async function testShareNotFound() {
    const req = createMockReq('GET', '/api/share/ZZZZ');
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode !== 404) throw new Error('Should return 404 for missing share');
}

async function testHealthCheck() {
    const req = createMockReq('GET', '/health');
    const res = createMockRes();
    await handler(req, res);
    if (res.statusCode !== 200) throw new Error('Health check failed');
    const data = JSON.parse(res.body);
    if (data.status !== 'healthy') throw new Error('Health check response invalid');
}

async function testViewCounting() {
    // Create initial share
    const createReq = createMockReq('POST', '/api/share', {
        content: 'View count test content',
        contentType: 'text',
        duration: '15m'
    });
    const createRes = createMockRes();
    await handler(createReq, createRes);
    if (createRes.statusCode !== 200) throw new Error('Share creation failed');
    const share = JSON.parse(createRes.body);
    if (!share.code) throw new Error('No code returned');

    console.log(`Testing view counts for share code: ${share.code}`);    // Test multiple retrievals to verify view counting starts from 0
    for (let i = 0; i < 3; i++) {
        const retrieveReq = createMockReq('GET', `/api/share/${share.code}`);
        const retrieveRes = createMockRes();
        await handler(retrieveReq, retrieveRes);
        
        if (retrieveRes.statusCode !== 200) throw new Error(`Retrieval ${i + 1} failed`);
        const retrieved = JSON.parse(retrieveRes.body);
        
        // Verify view count shows BEFORE increment (0, 1, 2...)
        if (retrieved.views !== i) {
            throw new Error(`View count mismatch. Expected ${i}, got ${retrieved.views}`);
        }
        console.log(`✓ Access ${i + 1}: Shows ${i} views (correct)`);

        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log(`✓ View counting works correctly: First access shows 0 views, increments properly`);
}

// Run tests
console.log('🧪 Starting API Tests...\n');
(async () => {
    try {
        await runTest('Share lifecycle (create, retrieve, update, verify)', testShareLifecycle);
        await runTest('Share not found returns 404', testShareNotFound);
        await runTest('View counting works correctly', testViewCounting);
        await runTest('Health check endpoint', testHealthCheck);
        console.log('\n✨ API Tests completed');
    } catch (error) {
        console.error('\n❌ Test suite failed:', error);
    } finally {
        // Ensure process exits
        setTimeout(() => process.exit(0), 100);
    }
})();
