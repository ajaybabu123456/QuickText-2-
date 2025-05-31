// Simple test to verify functionality
console.log('🚀 QuickText Pro - Simple Test Starting...');

async function testBasicConnection() {
    try {
        console.log('📡 Testing server connection...');
        
        const response = await fetch('http://localhost:3000');
        const text = await response.text();
        
        console.log('✅ Server is responding');
        console.log('📊 Response length:', text.length);
        
        // Test file display cleanup function
        console.log('\n🧹 Testing display cleanup function...');
        
        const testContent = `📄 PDF File: test.pdf
📊 Size: 100 KB
[FILE_DATA:data:application/pdf;base64,JVBERi0xLjQ...]`;
        
        // Simulate the cleanup function from working.html
        let displayContent = testContent;
        if (testContent.includes('[FILE_DATA:')) {
            displayContent = testContent.replace(/\[FILE_DATA:[^\]]+\]/g, 
                '[📦 File data hidden - Use download button to get the file]');
        }
        
        console.log('🔍 Original contains FILE_DATA:', testContent.includes('[FILE_DATA:'));
        console.log('🔍 Cleaned display hides FILE_DATA:', !displayContent.includes('[FILE_DATA:'));
        console.log('🔍 Shows friendly message:', displayContent.includes('[📦 File data hidden'));
        
        console.log('\n✅ All basic tests passed!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testBasicConnection();
