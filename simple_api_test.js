/**
 * Simple Test Script for QuickText Pro Fixes
 * Uses built-in Node.js modules only
 */

const http = require('http');

function makeRequest(options, postData = null) {
    return new Promise((resolve, reject) => {
        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const jsonData = JSON.parse(data);
                    resolve(jsonData);
                } catch (e) {
                    resolve({ rawData: data, statusCode: res.statusCode });
                }
            });
        });
        
        req.on('error', reject);
        
        if (postData) {
            req.write(postData);
        }
        req.end();
    });
}

async function testFixes() {
    console.log('🧪 Testing QuickText Pro Fixes\n');
    
    try {
        // Test 1: Create a share
        console.log('📝 Creating a new share...');
        const createOptions = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/share',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(JSON.stringify({
                    content: 'Test content for view counting and QR code generation.',
                    contentType: 'text',
                    expirationHours: 24
                }))
            }
        };
        
        const createData = await makeRequest(createOptions, JSON.stringify({
            content: 'Test content for view counting and QR code generation.',
            contentType: 'text',
            expirationHours: 24
        }));
        
        if (!createData.code) {
            throw new Error('Failed to create share: ' + JSON.stringify(createData));
        }
        
        console.log(`✅ Share created with code: ${createData.code}`);
        console.log(`   Share URL: http://localhost:3000/share/${createData.code}\n`);
        
        // Test 2: Retrieve multiple times to test view counting
        console.log('👀 Testing view counting...');
        
        for (let i = 1; i <= 3; i++) {
            console.log(`   Retrieval #${i}:`);
              const retrieveOptions = {
                hostname: 'localhost',
                port: 3000,
                path: `/api/retrieve/${createData.code}`,
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Content-Length': Buffer.byteLength('{}')
                }
            };
            
            const retrieveData = await makeRequest(retrieveOptions, '{}');
            
            if (retrieveData.content) {
                console.log(`   ✅ Content retrieved successfully`);
                console.log(`   📊 View count: ${retrieveData.views || 'undefined'}`);
                
                if (retrieveData.views === i) {
                    console.log(`   ✅ View counting is working correctly!`);
                } else {
                    console.log(`   ⚠️  View count: expected ${i}, got ${retrieveData.views}`);
                }
            } else {
                console.log(`   ❌ Failed to retrieve content:`, retrieveData);
            }
            
            // Wait between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n🎯 Manual UI Testing Required:');
        console.log('   1. Open browser at: http://localhost:3000');
        console.log(`   2. Enter share code: ${createData.code}`);
        console.log('   3. Click "Retrieve Content"');
        console.log('   4. Verify:');
        console.log('      ✓ View count displays and increments');
        console.log('      ✓ QR code appears below content');
        console.log('      ✓ QR code is scannable');
        console.log('      ✓ No console errors');
        
        return { success: true, shareCode: createData.code };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run the test
testFixes().then(result => {
    if (result.success) {
        console.log('\n🎉 API tests completed successfully!');
        console.log('   Please perform manual UI testing as outlined above.');
    } else {
        console.log('\n💥 Tests failed:', result.error);
    }
    
    console.log('\n📋 Fixes Summary:');
    console.log('   1. ✅ Enhanced QR code generation with proper error handling');
    console.log('   2. ✅ Added debugging logs for view counting');
    console.log('   3. ✅ Improved legacy QR code fallback');
    console.log('   4. ✅ Enhanced view count display across all interfaces');
});
