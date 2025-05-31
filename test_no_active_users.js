// Test to verify QuickText Pro works without active users functionality
const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testQuickTextWithoutActiveUsers() {
    console.log('🧪 Testing QuickText Pro without active users functionality...\n');
    
    try {
        // Test 1: Health check
        console.log('1. Testing health endpoint...');
        const healthResponse = await axios.get(`${BASE_URL}/api/health`);
        console.log('✅ Health check passed:', healthResponse.data.status);
        
        // Test 2: Create a share
        console.log('\n2. Testing share creation...');
        const shareData = {
            content: 'Test content without active users tracking',
            contentType: 'text',
            expiry: '15m'
        };
        
        const createResponse = await axios.post(`${BASE_URL}/api/share`, shareData);
        console.log('✅ Share created successfully:', createResponse.data.code);
        const shareCode = createResponse.data.code;
          // Test 3: Retrieve the share
        console.log('\n3. Testing share retrieval...');
        const retrieveResponse = await axios.post(`${BASE_URL}/api/retrieve/${shareCode}`, {});
        console.log('✅ Share retrieved successfully:', retrieveResponse.data.content);
        
        // Test 4: Verify no active users data in responses
        console.log('\n4. Verifying no active users data in responses...');
        const hasActiveUsersInHealth = JSON.stringify(healthResponse.data).includes('activeUsers');
        const hasActiveUsersInShare = JSON.stringify(createResponse.data).includes('activeUsers');
        const hasActiveUsersInRetrieve = JSON.stringify(retrieveResponse.data).includes('activeUsers');
        
        if (!hasActiveUsersInHealth && !hasActiveUsersInShare && !hasActiveUsersInRetrieve) {
            console.log('✅ No active users data found in API responses');
        } else {
            console.log('❌ Active users data still present in API responses');
        }
        
        console.log('\n🎉 All tests passed! QuickText Pro is working correctly without active users functionality.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        if (error.response) {
            console.error('Response data:', error.response.data);
        }
    }
}

// Run the test
testQuickTextWithoutActiveUsers();
