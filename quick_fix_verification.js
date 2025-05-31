/**
 * Simple Fix Verification Test
 * Tests both theme toggle and view counting fixes without external dependencies
 */

const fs = require('fs');
const path = require('path');

function testAlpineJSFixes() {
    console.log('🔍 Testing Alpine.js Component Fixes');
    console.log('='.repeat(50));
    
    try {
        // Read main.js file
        const mainJsPath = path.join(__dirname, 'public', 'main.js');
        const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
        
        // Test 1: Check for isDarkMode property
        const hasIsDarkMode = mainJsContent.includes('isDarkMode: true');
        console.log(`✓ isDarkMode property initialized: ${hasIsDarkMode ? '✅ PASS' : '❌ FAIL'}`);
        
        // Test 2: Check for proper toggle method
        const hasProperToggle = mainJsContent.includes('this.isDarkMode = !this.isDarkMode');
        console.log(`✓ Toggle method updates state: ${hasProperToggle ? '✅ PASS' : '❌ FAIL'}`);
        
        // Test 3: Check for proper initialization
        const hasProperInit = mainJsContent.includes('this.isDarkMode = savedTheme === \'dark\'');
        console.log(`✓ Theme initialization sets state: ${hasProperInit ? '✅ PASS' : '❌ FAIL'}`);
        
        // Test 4: Check for console logging (debugging)
        const hasLogging = mainJsContent.includes('console.log(\'🌙 Switched to dark mode\')');
        console.log(`✓ Debug logging present: ${hasLogging ? '✅ PASS' : '❌ FAIL'}`);
        
        return hasIsDarkMode && hasProperToggle && hasProperInit;
        
    } catch (error) {
        console.error('❌ Error reading main.js:', error.message);
        return false;
    }
}

function testHTMLFixes() {
    console.log('\n🔍 Testing HTML Template Fixes');
    console.log('='.repeat(50));
    
    try {
        // Read index.html file
        const indexHtmlPath = path.join(__dirname, 'public', 'index.html');
        const indexHtmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
        
        // Test 1: Check for dynamic theme toggle binding
        const hasDynamicBinding = indexHtmlContent.includes('x-bind:class="isDarkMode ? \'fas fa-sun\' : \'fas fa-moon\'"');
        console.log(`✓ Dynamic theme toggle binding: ${hasDynamicBinding ? '✅ PASS' : '❌ FAIL'}`);
        
        // Test 2: Check that old static icon is replaced
        const hasStaticIcon = indexHtmlContent.includes('<i class="fas fa-moon"></i>') && 
                             !indexHtmlContent.includes('x-bind:class');
        console.log(`✓ Static icon removed: ${!hasStaticIcon ? '✅ PASS' : '❌ FAIL'}`);
        
        return hasDynamicBinding && !hasStaticIcon;
        
    } catch (error) {
        console.error('❌ Error reading index.html:', error.message);
        return false;
    }
}

function testBackendViewCounting() {
    console.log('\n🔍 Testing Backend View Counting Logic');
    console.log('='.repeat(50));
    
    try {
        // Read server.js file
        const serverJsPath = path.join(__dirname, 'server.js');
        const serverJsContent = fs.readFileSync(serverJsPath, 'utf8');
        
        // Test 1: Check for view increment logic
        const hasViewIncrement = serverJsContent.includes('share.views++') || 
                                serverJsContent.includes('share.views += 1');
        console.log(`✓ View increment logic present: ${hasViewIncrement ? '✅ PASS' : '❌ FAIL'}`);
        
        // Test 2: Check for view counting in retrieve endpoint
        const hasRetrieveEndpoint = serverJsContent.includes('/api/retrieve/');
        console.log(`✓ Retrieve endpoint exists: ${hasRetrieveEndpoint ? '✅ PASS' : '❌ FAIL'}`);
        
        return hasViewIncrement && hasRetrieveEndpoint;
        
    } catch (error) {
        console.error('❌ Error reading server.js:', error.message);
        return false;
    }
}

function runQuickVerification() {
    console.log('🚀 QuickText Pro - Quick Fix Verification');
    console.log('Testing Theme Toggle & View Counting Fixes');
    console.log('='.repeat(60));
    
    const results = {
        alpineJS: testAlpineJSFixes(),
        html: testHTMLFixes(),
        backend: testBackendViewCounting()
    };
    
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`Alpine.js Component: ${results.alpineJS ? '✅ FIXED' : '❌ NEEDS WORK'}`);
    console.log(`HTML Template: ${results.html ? '✅ FIXED' : '❌ NEEDS WORK'}`);
    console.log(`Backend Logic: ${results.backend ? '✅ FIXED' : '❌ NEEDS WORK'}`);
    
    const allFixed = Object.values(results).every(result => result === true);
    
    if (allFixed) {
        console.log('\n🎉 ALL FIXES VERIFIED IN CODE!');
        console.log('\n📋 What should work now:');
        console.log('  ✅ Theme toggle button icon changes when clicked');
        console.log('  ✅ View count increments each time content is retrieved');
        console.log('\n🌐 Ready for manual testing:');
        console.log('  👉 Open http://localhost:3000');
        console.log('  👉 Test theme toggle (icon should change)');
        console.log('  👉 Create and retrieve content (views should increment)');
    } else {
        console.log('\n⚠️  SOME FIXES MAY NEED ATTENTION');
        console.log('Please check the failed tests above');
    }
    
    return allFixed;
}

// Run verification
if (require.main === module) {
    const success = runQuickVerification();
    console.log('\n' + '='.repeat(60));
    process.exit(success ? 0 : 1);
}

module.exports = { runQuickVerification };
