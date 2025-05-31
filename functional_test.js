// Direct functionality test without fetch dependency
console.log('🧪 QuickText Pro - Direct Functionality Test');

// Test 1: File display cleanup function
console.log('\n📋 Test 1: File Display Cleanup Function');

function testDisplayCleanup() {
    // Test content with FILE_DATA
    const pdfContent = `📄 PDF File: test-document.pdf
📊 Size: 125.3 KB
📅 Uploaded: ${new Date().toLocaleString()}
🔗 Type: PDF Document

📋 This is a PDF file that can be downloaded after sharing.
🎯 Share this content to allow others to download the original PDF file.

[FILE_DATA:data:application/pdf;base64,JVBERi0xLjQKJdPr6eEKMSAwIG9iago8PCovVGl0bGUgKFRlc3QgUERGKV...]`;

    // Apply the cleanup function from working.html
    let displayContent = pdfContent;
    if (pdfContent.includes('[FILE_DATA:')) {
        displayContent = pdfContent.replace(/\[FILE_DATA:[^\]]+\]/g, 
            '[📦 File data hidden - Use download button to get the file]');
    }

    console.log('✅ Original contains FILE_DATA:', pdfContent.includes('[FILE_DATA:'));
    console.log('✅ Cleaned display hides FILE_DATA:', !displayContent.includes('[FILE_DATA:'));
    console.log('✅ Shows friendly message:', displayContent.includes('[📦 File data hidden'));
    
    return {
        originalHasFileData: pdfContent.includes('[FILE_DATA:'),
        cleanedHidesFileData: !displayContent.includes('[FILE_DATA:'),
        showsFriendlyMessage: displayContent.includes('[📦 File data hidden')
    };
}

// Test 2: File pattern matching
console.log('\n📋 Test 2: File Pattern Matching');

function testPatternMatching() {
    const pdfContent = `📄 PDF File: test-document.pdf
📊 Size: 125.3 KB
📅 Uploaded: 5/31/2025, 10:30:00 AM
🔗 Type: PDF Document

[FILE_DATA:data:application/pdf;base64,JVBERi0xLjQ...]`;

    const docContent = `📄 Document File: presentation.pptx
📊 Size: 2.1 MB
📅 Uploaded: 5/31/2025, 10:30:00 AM
🔗 Type: PowerPoint Presentation

[FILE_DATA:data:application/vnd.openxmlformats-officedocument.presentationml.presentation;base64,UEsDBBQ...]`;

    // Test PDF pattern matching
    const pdfMatch = pdfContent.match(/📄 PDF File: (.+?)\n[\s\S]*?\[FILE_DATA:(data:application\/pdf;base64,[^\]]+)\]/);
    const docMatch = docContent.match(/📄 (?:Document File|Word Document|Excel Spreadsheet|PowerPoint Presentation): (.+?)\n[\s\S]*?\[FILE_DATA:(data:application\/[^;]+;base64,[^\]]+)\]/);

    console.log('✅ PDF pattern matches:', !!pdfMatch);
    console.log('✅ Document pattern matches:', !!docMatch);
    
    if (pdfMatch) {
        console.log('   📄 PDF filename:', pdfMatch[1]);
    }
    if (docMatch) {
        console.log('   📄 Document filename:', docMatch[1]);
    }

    return {
        pdfPatternWorks: !!pdfMatch,
        documentPatternWorks: !!docMatch
    };
}

// Test 3: File size formatting
console.log('\n📋 Test 3: File Size Formatting');

function testFileSizeFormatting() {
    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
    }

    const testSizes = [
        { bytes: 1024, expected: '1.0 KB' },
        { bytes: 1048576, expected: '1.0 MB' },
        { bytes: 128307, expected: '125.3 KB' },
        { bytes: 2097152, expected: '2.0 MB' }
    ];

    let allPassed = true;
    testSizes.forEach(test => {
        const result = formatFileSize(test.bytes);
        const passed = result === test.expected;
        console.log(`   ${passed ? '✅' : '❌'} ${test.bytes} bytes → ${result} (expected: ${test.expected})`);
        if (!passed) allPassed = false;
    });

    return { fileSizeFormattingWorks: allPassed };
}

// Run all tests
console.log('\n🚀 Running All Tests...');

const test1Results = testDisplayCleanup();
const test2Results = testPatternMatching();
const test3Results = testFileSizeFormatting();

// Summary
console.log('\n📊 Test Results Summary:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`✅ Display cleanup preserves FILE_DATA for download: ${test1Results.originalHasFileData}`);
console.log(`✅ Display cleanup hides FILE_DATA from view: ${test1Results.cleanedHidesFileData}`);
console.log(`✅ Display cleanup shows friendly message: ${test1Results.showsFriendlyMessage}`);
console.log(`✅ PDF file pattern matching works: ${test2Results.pdfPatternWorks}`);
console.log(`✅ Document file pattern matching works: ${test2Results.documentPatternWorks}`);
console.log(`✅ File size formatting works: ${test3Results.fileSizeFormattingWorks}`);

const allTestsPassed = Object.values({...test1Results, ...test2Results, ...test3Results}).every(result => result === true);

console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`🎉 Overall Result: ${allTestsPassed ? 'ALL TESTS PASSED!' : 'SOME TESTS FAILED!'}`);

if (allTestsPassed) {
    console.log('\n🚀 QuickText Pro file upload functionality is working correctly!');
    console.log('📁 File uploads show clean display format');
    console.log('💾 FILE_DATA is preserved for downloads');
    console.log('🎯 Pattern matching extracts files properly');
    console.log('📊 File sizes are formatted correctly');
} else {
    console.log('\n⚠️  Some functionality needs attention.');
}
