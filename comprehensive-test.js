const http = require('http');

// Test helper function
const makeRequest = (options, data) => {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', chunk => body += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(body);
                    resolve({ status: res.statusCode, data: parsed });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });
        
        req.on('error', reject);
        
        if (data) {
            req.write(JSON.stringify(data));
        }
        req.end();
    });
};

const runComprehensiveTest = async () => {
    console.log('🚀 Starting Comprehensive QuickText Pro Test Suite\n');
    process.stdout.write('🚀 Starting Comprehensive QuickText Pro Test Suite\n');
    
    try {
        // Test 1: Basic Share Creation
        console.log('📝 Test 1: Basic Share Creation');
        process.stdout.write('📝 Test 1: Basic Share Creation\n');
        const shareOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/share',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            }
        };
        
        const shareData = {
            content: 'Hello World! This is a comprehensive test of QuickText Pro.',
            contentType: 'text',
            duration: '15m'
        };
        
        const shareResult = await makeRequest(shareOptions, shareData);
        
        if (shareResult.status === 200) {
            console.log(`✅ Share created successfully: ${shareResult.data.code}`);
            const testCode = shareResult.data.code;
            
            // Test 2: Retrieve via new endpoint
            console.log('\n🔍 Test 2: Retrieve via new endpoint (/api/retrieve)');
            const retrieveOptions = {
                hostname: 'localhost',
                port: 3000,
                path: `/api/retrieve/${testCode}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const retrieveResult = await makeRequest(retrieveOptions, { password: null });
            
            if (retrieveResult.status === 200 && retrieveResult.data.content === shareData.content) {
                console.log('✅ Content retrieved successfully via new endpoint');
            } else {
                console.log('❌ Failed to retrieve via new endpoint:', retrieveResult);
            }
            
            // Test 3: Retrieve via legacy endpoint
            console.log('\n🔍 Test 3: Retrieve via legacy endpoint (/api/share)');
            const legacyOptions = {
                hostname: 'localhost',
                port: 3000,
                path: `/api/share/${testCode}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            };
            
            const legacyResult = await makeRequest(legacyOptions, { password: null });
            
            if (legacyResult.status === 200 && legacyResult.data.content === shareData.content) {
                console.log('✅ Content retrieved successfully via legacy endpoint');
            } else {
                console.log('❌ Failed to retrieve via legacy endpoint:', legacyResult);
            }
            
            // Test 4: Password Protected Share
            console.log('\n🔒 Test 4: Password Protected Share');
            const passwordShareData = {
                content: 'This is a secret message!',
                contentType: 'text',
                duration: '15m',
                password: 'secret123'
            };
            
            const passwordShareResult = await makeRequest(shareOptions, passwordShareData);
            
            if (passwordShareResult.status === 200) {
                console.log(`✅ Password-protected share created: ${passwordShareResult.data.code}`);
                const protectedCode = passwordShareResult.data.code;
                
                // Test 4a: Try without password
                console.log('\n🔒 Test 4a: Access without password (should fail)');
                const noPasswordOptions = {
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/retrieve/${protectedCode}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                const noPasswordResult = await makeRequest(noPasswordOptions, { password: null });
                
                if (noPasswordResult.status === 401 && noPasswordResult.data.requiresPassword) {
                    console.log('✅ Correctly rejected access without password');
                } else {
                    console.log('❌ Should have rejected access without password:', noPasswordResult);
                }
                
                // Test 4b: Try with correct password
                console.log('\n🔒 Test 4b: Access with correct password');
                const correctPasswordResult = await makeRequest(noPasswordOptions, { password: 'secret123' });
                
                if (correctPasswordResult.status === 200 && correctPasswordResult.data.content === passwordShareData.content) {
                    console.log('✅ Successfully accessed with correct password');
                } else {
                    console.log('❌ Failed to access with correct password:', correctPasswordResult);
                }
            } else {
                console.log('❌ Failed to create password-protected share:', passwordShareResult);
            }
            
            // Test 5: Code Share with Language
            console.log('\n💻 Test 5: Code Share with Language Detection');
            const codeShareData = {
                content: `function fibonacci(n) {
    if (n <= 1) return n;
    return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));`,
                contentType: 'code',
                language: 'javascript',
                duration: '30m'
            };
            
            const codeShareResult = await makeRequest(shareOptions, codeShareData);
            
            if (codeShareResult.status === 200) {
                console.log(`✅ Code share created: ${codeShareResult.data.code}`);
                
                const codeRetrieveOptions = {
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/retrieve/${codeShareResult.data.code}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                const codeRetrieveResult = await makeRequest(codeRetrieveOptions, { password: null });
                
                if (codeRetrieveResult.status === 200 && codeRetrieveResult.data.language === 'javascript') {
                    console.log('✅ Code retrieved with correct language metadata');
                } else {
                    console.log('❌ Code retrieval failed or missing metadata:', codeRetrieveResult);
                }
            } else {
                console.log('❌ Failed to create code share:', codeShareResult);
            }
            
            // Test 6: One-time Access
            console.log('\n🔥 Test 6: One-time Access Share');
            const oneTimeData = {
                content: 'This message will self-destruct after reading!',
                contentType: 'text',
                duration: '15m',
                oneTimeAccess: true
            };
            
            const oneTimeResult = await makeRequest(shareOptions, oneTimeData);
            
            if (oneTimeResult.status === 200) {
                console.log(`✅ One-time share created: ${oneTimeResult.data.code}`);
                const oneTimeCode = oneTimeResult.data.code;
                
                // First access
                const firstAccessOptions = {
                    hostname: 'localhost',
                    port: 3000,
                    path: `/api/retrieve/${oneTimeCode}`,
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                };
                
                const firstAccessResult = await makeRequest(firstAccessOptions, { password: null });
                
                if (firstAccessResult.status === 200) {
                    console.log('✅ First access successful');
                    
                    // Second access (should fail)
                    const secondAccessResult = await makeRequest(firstAccessOptions, { password: null });
                    
                    if (secondAccessResult.status === 404) {
                        console.log('✅ Second access correctly denied (one-time only)');
                    } else {
                        console.log('❌ Second access should have been denied:', secondAccessResult);
                    }
                } else {
                    console.log('❌ First access failed:', firstAccessResult);
                }
            } else {
                console.log('❌ Failed to create one-time share:', oneTimeResult);
            }
            
        } else {
            console.log('❌ Initial share creation failed:', shareResult);
        }
        
        console.log('\n🎉 Test Suite Completed!');
        
    } catch (error) {
        console.error('❌ Test suite failed:', error.message);
    }
};

runComprehensiveTest();
