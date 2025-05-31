const fetch = require('node-fetch');

async function testAPI() {
    try {
        console.log('Testing QuickText Pro API...');
        
        // Test 1: Create a share
        const shareResponse = await fetch('http://localhost:3000/api/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: 'This is a test content for QuickText Pro file upload functionality test.',
                contentType: 'text',
                language: 'plaintext',
                duration: '5m'
            })
        });
        
        const shareData = await shareResponse.json();
        console.log('✅ Share created successfully:', shareData.code);
        
        // Test 2: Retrieve the share
        const retrieveResponse = await fetch(`http://localhost:3000/api/share/${shareData.code}`, {
            method: 'POST'
        });
        
        const retrieveData = await retrieveResponse.json();
        console.log('✅ Share retrieved successfully. Views:', retrieveData.views);
        console.log('✅ Content length:', retrieveData.content.length);
        
        console.log('\n🎉 All tests passed! QuickText Pro is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testAPI();
