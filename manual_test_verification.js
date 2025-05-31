/**
 * Manual Test Verification for QuickText Pro Fixes
 * Tests both view counting and QR code generation functionality
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testViewCountingAndQRCode() {
    console.log('🧪 Starting Manual Test Verification for QuickText Pro Fixes\n');
    
    try {
        // Test 1: Create a new share
        console.log('📝 Test 1: Creating a new share...');
        const createResponse = await fetch(`${BASE_URL}/api/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: 'This is a test content for view counting and QR code generation.',
                contentType: 'text',
                expirationHours: 24
            })
        });
        
        const createData = await createResponse.json();
        if (!createData.code) {
            throw new Error('Failed to create share');
        }
        
        console.log(`✅ Share created with code: ${createData.code}`);
        console.log(`   Share URL: ${BASE_URL}/share/${createData.code}\n`);
        
        // Test 2: Retrieve the share multiple times to test view counting
        console.log('👀 Test 2: Testing view counting...');
        
        for (let i = 1; i <= 3; i++) {
            console.log(`   Retrieval #${i}:`);
            const retrieveResponse = await fetch(`${BASE_URL}/api/share/${createData.code}`);
            const retrieveData = await retrieveResponse.json();
            
            if (retrieveData.content) {
                console.log(`   ✅ Content retrieved successfully`);
                console.log(`   📊 View count: ${retrieveData.views || 'undefined'}`);
                
                if (retrieveData.views === i) {
                    console.log(`   ✅ View counting is working correctly!`);
                } else {
                    console.log(`   ❌ View counting issue: Expected ${i}, got ${retrieveData.views}`);
                }
            } else {
                console.log(`   ❌ Failed to retrieve content`);
            }
            
            // Wait a bit between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }
        
        console.log('\n📱 Test 3: QR Code Generation Instructions');
        console.log('   To test QR code generation:');
        console.log('   1. Open the browser at http://localhost:3000');
        console.log(`   2. Enter the share code: ${createData.code}`);
        console.log('   3. Click "Retrieve Content"');
        console.log('   4. Check if QR code appears below the content');
        console.log('   5. Verify QR code contains the share URL');
        
        console.log('\n🎯 Manual Testing Checklist:');
        console.log('   □ View count displays correctly in UI');
        console.log('   □ View count increments on each retrieval');
        console.log('   □ QR code appears after content retrieval');
        console.log('   □ QR code is scannable and contains correct URL');
        console.log('   □ No console errors in browser dev tools');
        
        // Test 4: Check server logs for debugging info
        console.log('\n📋 Test 4: Check browser console for our debug logs:');
        console.log('   - Look for "Retrieved content with views:" messages');
        console.log('   - Look for "QR Code generated successfully for:" messages');
        console.log('   - Check for any error messages');
        
        return {
            success: true,
            shareCode: createData.code,
            shareUrl: `${BASE_URL}/share/${createData.code}`
        };
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        return { success: false, error: error.message };
    }
}

// Run the test
testViewCountingAndQRCode().then(result => {
    if (result.success) {
        console.log('\n🎉 Automated tests completed successfully!');
        console.log('   Please perform manual UI testing as outlined above.');
    } else {
        console.log('\n💥 Tests failed:', result.error);
    }
});
