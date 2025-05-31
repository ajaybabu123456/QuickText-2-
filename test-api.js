// Simple API test script
const testAPI = async () => {
    try {
        console.log('Testing QuickText Pro API...');
        
        // Test 1: Create a share
        console.log('\n1. Testing share creation...');
        const shareResponse = await fetch('http://localhost:3000/api/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: 'Hello World! This is a test.',
                contentType: 'text',
                duration: '15m'
            })
        });
        
        if (shareResponse.ok) {
            const shareData = await shareResponse.json();
            console.log('✅ Share created successfully:', shareData.code);
            
            // Test 2: Retrieve the share
            console.log('\n2. Testing share retrieval...');
            const retrieveResponse = await fetch(`http://localhost:3000/api/retrieve/${shareData.code}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: null })
            });
            
            if (retrieveResponse.ok) {
                const retrieveData = await retrieveResponse.json();
                console.log('✅ Share retrieved successfully:', retrieveData.content);
            } else {
                console.log('❌ Failed to retrieve share:', await retrieveResponse.text());
            }
            
            // Test 3: Test legacy endpoint
            console.log('\n3. Testing legacy endpoint...');
            const legacyResponse = await fetch(`http://localhost:3000/api/share/${shareData.code}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: null })
            });
            
            if (legacyResponse.ok) {
                const legacyData = await legacyResponse.json();
                console.log('✅ Legacy endpoint works:', legacyData.content);
            } else {
                console.log('❌ Legacy endpoint failed:', await legacyResponse.text());
            }
            
        } else {
            console.log('❌ Failed to create share:', await shareResponse.text());
        }
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
};

testAPI();
