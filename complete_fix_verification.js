/**
 * Complete Fix Verification Test
 * Tests both theme toggle and view counting fixes
 */

const fetch = require('node-fetch');

const BASE_URL = 'http://localhost:3000';

async function testViewCounting() {
    console.log('\n=== Testing View Counting Fix ===');
    
    try {
        // Step 1: Create a share
        const shareResponse = await fetch(`${BASE_URL}/api/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: 'Testing view counting functionality',
                contentType: 'text',
                expiry: '1h'
            })
        });
        
        if (!shareResponse.ok) {
            throw new Error(`Share creation failed: ${shareResponse.status}`);
        }
        
        const shareData = await shareResponse.json();
        console.log('✅ Share created:', shareData.code);
        
        // Step 2: Retrieve content multiple times and check view count
        const retrievePromises = [];
        for (let i = 1; i <= 3; i++) {
            retrievePromises.push(
                fetch(`${BASE_URL}/api/retrieve/${shareData.code}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                }).then(async (response) => {
                    if (!response.ok) {
                        throw new Error(`Retrieve failed: ${response.status}`);
                    }
                    const data = await response.json();
                    console.log(`📊 Retrieve attempt ${i} - Views: ${data.views}`);
                    return { attempt: i, views: data.views };
                })
            );
        }
        
        const results = await Promise.all(retrievePromises);
        
        // Verify view counting is working
        const viewCounts = results.map(r => r.views);
        console.log('View count progression:', viewCounts);
        
        if (viewCounts[0] === 1 && viewCounts[1] === 2 && viewCounts[2] === 3) {
            console.log('✅ View counting is working correctly!');
            return true;
        } else {
            console.log('❌ View counting is not incrementing properly');
            return false;
        }
        
    } catch (error) {
        console.error('❌ View counting test failed:', error.message);
        return false;
    }
}

async function testThemeToggleAPI() {
    console.log('\n=== Testing Theme Toggle (Server Response) ===');
    
    try {
        // Test that the main page loads properly
        const pageResponse = await fetch(`${BASE_URL}/`);
        
        if (!pageResponse.ok) {
            throw new Error(`Page load failed: ${pageResponse.status}`);
        }
        
        const htmlContent = await pageResponse.text();
        
        // Check if the dynamic theme toggle binding is present
        const hasThemeToggle = htmlContent.includes('x-bind:class="isDarkMode ? \'fas fa-sun\' : \'fas fa-moon\'"');
        
        if (hasThemeToggle) {
            console.log('✅ Theme toggle with dynamic binding found in HTML');
            return true;
        } else {
            console.log('❌ Dynamic theme toggle binding not found');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Theme toggle API test failed:', error.message);
        return false;
    }
}

async function testAlpineJSComponentState() {
    console.log('\n=== Testing Alpine.js Component State ===');
    
    try {
        // Test that the main.js file has the correct structure
        const fs = require('fs');
        const mainJsPath = './public/main.js';
        
        if (!fs.existsSync(mainJsPath)) {
            throw new Error('main.js file not found');
        }
        
        const mainJsContent = fs.readFileSync(mainJsPath, 'utf8');
        
        // Check for key fixes
        const hasIsDarkMode = mainJsContent.includes('isDarkMode: true');
        const hasProperToggle = mainJsContent.includes('this.isDarkMode = !this.isDarkMode');
        const hasProperInit = mainJsContent.includes('this.isDarkMode = savedTheme === \'dark\'');
        
        console.log('isDarkMode property present:', hasIsDarkMode ? '✅' : '❌');
        console.log('Proper toggle logic present:', hasProperToggle ? '✅' : '❌');
        console.log('Proper initialization present:', hasProperInit ? '✅' : '❌');
        
        if (hasIsDarkMode && hasProperToggle && hasProperInit) {
            console.log('✅ Alpine.js component state is correctly implemented');
            return true;
        } else {
            console.log('❌ Alpine.js component state has issues');
            return false;
        }
        
    } catch (error) {
        console.error('❌ Alpine.js component test failed:', error.message);
        return false;
    }
}

async function runCompleteVerification() {
    console.log('🚀 Starting Complete Fix Verification Test');
    console.log('Testing QuickText Pro - Theme Toggle & View Counting Fixes');
    console.log('='.repeat(60));
    
    const results = {
        viewCounting: false,
        themeToggleAPI: false,
        alpineJSState: false
    };
    
    // Run all tests
    results.viewCounting = await testViewCounting();
    results.themeToggleAPI = await testThemeToggleAPI();
    results.alpineJSState = await testAlpineJSComponentState();
    
    // Summary
    console.log('\n' + '='.repeat(60));
    console.log('📊 VERIFICATION SUMMARY');
    console.log('='.repeat(60));
    
    console.log(`View Counting Fix: ${results.viewCounting ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Theme Toggle API: ${results.themeToggleAPI ? '✅ WORKING' : '❌ FAILED'}`);
    console.log(`Alpine.js State: ${results.alpineJSState ? '✅ WORKING' : '❌ FAILED'}`);
    
    const allPassed = Object.values(results).every(result => result === true);
    
    if (allPassed) {
        console.log('\n🎉 ALL FIXES VERIFIED SUCCESSFULLY!');
        console.log('✅ Theme toggle icon should update when clicked');
        console.log('✅ View counting should increment properly');
        console.log('\n👉 Manual testing recommended:');
        console.log('   1. Open http://localhost:3000 in browser');
        console.log('   2. Click theme toggle button - icon should change');
        console.log('   3. Create and retrieve content - view count should increment');
    } else {
        console.log('\n❌ SOME FIXES NEED ATTENTION');
        console.log('Please check the failed tests above');
    }
    
    return allPassed;
}

// Run the verification
if (require.main === module) {
    runCompleteVerification()
        .then(success => {
            process.exit(success ? 0 : 1);
        })
        .catch(error => {
            console.error('Test execution failed:', error);
            process.exit(1);
        });
}

module.exports = { runCompleteVerification };
