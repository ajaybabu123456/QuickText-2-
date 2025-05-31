// Theme Toggle Removal Verification Test
const axios = require('axios');

async function verifyThemeToggleRemoval() {
    try {
        console.log('🗑️  Verifying Theme Toggle Button Removal...\n');
        
        // Test 1: Check if the main page loads without theme toggle
        console.log('1. Testing main page without theme toggle...');
        const response = await axios.get('http://localhost:3000');
        
        if (response.status === 200) {
            console.log('✅ Main page loads successfully');
            
            const htmlContent = response.data;
            
            // Check that theme toggle button is removed
            const hasToggleButton = htmlContent.includes('@click="toggleTheme()"');
            const hasSunIcon = htmlContent.includes('fa-sun');
            const hasMoonIcon = htmlContent.includes('fa-moon');
            const hasIsDarkModeBinding = htmlContent.includes('isDarkMode');
            
            console.log(`🔍 Theme toggle button present: ${hasToggleButton ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
            console.log(`🔍 Sun icon binding present: ${hasSunIcon ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
            console.log(`🔍 Moon icon binding present: ${hasMoonIcon ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
            console.log(`🔍 isDarkMode binding present: ${hasIsDarkModeBinding ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
            
            // Test 2: Check JavaScript functionality removal
            console.log('\n2. Checking JavaScript functionality removal...');
            
            // Check if main.js is accessible
            try {
                const jsResponse = await axios.get('http://localhost:3000/main.js');
                const jsContent = jsResponse.data;
                
                const hasIsDarkModeProperty = jsContent.includes('isDarkMode:');
                const hasToggleThemeFunction = jsContent.includes('toggleTheme()');
                const hasInitThemeFunction = jsContent.includes('initTheme()');
                const hasThemeToggleEventListener = jsContent.includes('themeToggle');
                
                console.log(`🔍 isDarkMode property: ${hasIsDarkModeProperty ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
                console.log(`🔍 toggleTheme function: ${hasToggleThemeFunction ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
                console.log(`🔍 initTheme function: ${hasInitThemeFunction ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
                console.log(`🔍 Theme toggle event listener: ${hasThemeToggleEventListener ? '❌ STILL EXISTS' : '✅ REMOVED'}`);
                
                // Overall verification
                const isCompletelyRemoved = !hasToggleButton && !hasIsDarkModeBinding && 
                                          !hasIsDarkModeProperty && !hasToggleThemeFunction && 
                                          !hasInitThemeFunction && !hasThemeToggleEventListener;
                
                console.log('\n🎯 REMOVAL VERIFICATION RESULT:');
                if (isCompletelyRemoved) {
                    console.log('✅ SUCCESS: Theme toggle button and all related functionality completely removed!');
                    console.log('\n📝 What was removed:');
                    console.log('  • Theme toggle button from navigation');
                    console.log('  • isDarkMode property from Alpine.js component');
                    console.log('  • toggleTheme() function');
                    console.log('  • initTheme() function');
                    console.log('  • Theme toggle event listeners');
                    console.log('  • Icon binding logic');
                    
                    console.log('\n✨ Your QuickText Pro app now runs without theme switching functionality.');
                } else {
                    console.log('❌ INCOMPLETE: Some theme toggle functionality still remains');
                    console.log('Please check the items marked with ❌ above');
                }
                
            } catch (jsError) {
                console.log('⚠️  Could not fetch main.js for verification');
            }
            
        } else {
            console.log('❌ Failed to load main page');
        }
        
    } catch (error) {
        console.log(`❌ Error during verification: ${error.message}`);
        console.log('Make sure the server is running on http://localhost:3000');
    }
}

// Run the verification
verifyThemeToggleRemoval();
