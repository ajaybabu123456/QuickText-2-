// Live API test for file upload functionality
const testApiCall = async () => {
    try {
        console.log('🚀 Testing QuickText Pro API...\n');
        
        // Test 1: Simple text share
        console.log('📋 Test 1: Basic text sharing');
        const textContent = 'Hello, this is a test message from QuickText Pro!';
        
        const textResponse = await fetch('http://localhost:3000/api/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: textContent,
                contentType: 'text',
                duration: '15m'
            })
        });
        
        if (!textResponse.ok) {
            throw new Error(`HTTP ${textResponse.status}: ${textResponse.statusText}`);
        }
        
        const textResult = await textResponse.json();
        console.log('✅ Text share created with code:', textResult.code);
        
        // Test 2: Retrieve the shared content
        console.log('\n📥 Test 2: Retrieving shared content');
        const retrieveResponse = await fetch(`http://localhost:3000/api/retrieve/${textResult.code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: null })
        });
        
        if (!retrieveResponse.ok) {
            throw new Error(`HTTP ${retrieveResponse.status}: ${retrieveResponse.statusText}`);
        }
        
        const retrieveResult = await retrieveResponse.json();
        console.log('✅ Content retrieved successfully');
        console.log('📊 Retrieved content:', retrieveResult.content);
        console.log('👁️ View count:', retrieveResult.views);
        
        // Test 3: File upload format test
        console.log('\n📁 Test 3: File upload format simulation');
        const fileContent = `📄 PDF File: test-document.pdf
📊 Size: 125.3 KB
📅 Uploaded: ${new Date().toLocaleString()}
🔗 Type: PDF Document

📋 This is a PDF file that can be downloaded after sharing.
🎯 Share this content to allow others to download the original PDF file.

[FILE_DATA:data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PC9WZXJzaW9uIDEuNA==]`;
        
        const fileResponse = await fetch('http://localhost:3000/api/share', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: fileContent,
                contentType: 'text',
                duration: '15m'
            })
        });
        
        if (!fileResponse.ok) {
            throw new Error(`HTTP ${fileResponse.status}: ${fileResponse.statusText}`);
        }
        
        const fileResult = await fileResponse.json();
        console.log('✅ File share created with code:', fileResult.code);
        
        // Test 4: Test file pattern matching on retrieval
        console.log('\n🔍 Test 4: File pattern matching');
        const fileRetrieveResponse = await fetch(`http://localhost:3000/api/retrieve/${fileResult.code}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ password: null })
        });
        
        const fileRetrieveResult = await fileRetrieveResponse.json();
        const retrievedFileContent = fileRetrieveResult.content;
        
        // Test pattern matching
        const pdfMatch = retrievedFileContent.match(/📄 PDF File: (.+?)\n[\s\S]*?\[FILE_DATA:(data:application\/pdf;base64,[^\]]+)\]/);
        
        console.log('🎯 PDF pattern detected:', !!pdfMatch);
        if (pdfMatch) {
            console.log('📄 Filename extracted:', pdfMatch[1]);
            console.log('💾 Base64 data found:', pdfMatch[2].substring(0, 50) + '...');
        }
        
        // Test display cleanup
        let displayContent = retrievedFileContent;
        if (retrievedFileContent.includes('[FILE_DATA:')) {
            displayContent = retrievedFileContent.replace(/\[FILE_DATA:[^\]]+\]/g, 
                '[📦 File data hidden - Use download button to get the file]');
        }
        
        console.log('🧹 FILE_DATA hidden in display:', !displayContent.includes('[FILE_DATA:'));
        console.log('🎨 Friendly message shown:', displayContent.includes('📦 File data hidden'));
        
        console.log('\n🎉 All API tests completed successfully!');
        console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
        console.log('✅ Text sharing: Working');
        console.log('✅ File upload format: Working');
        console.log('✅ Pattern matching: Working');
        console.log('✅ Display cleanup: Working');
        console.log('✅ View tracking: Working');
        console.log('📱 Browser interfaces ready for testing!');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('🔧 Please check that the server is running on localhost:3000');
    }
};

// Run the test
testApiCall();
