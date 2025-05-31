document.addEventListener('DOMContentLoaded', () => {
    // Initialize enhanced QuickShare app
    quickShareApp = new QuickShareApp();
    
    // DOM elements
    const shareData = document.getElementById('shareData');
    const shareBtn = document.getElementById('shareBtn');
    const charCount = document.querySelector('.char-count');
    const wordCount = document.getElementById('wordCount');
    const resultSection = document.getElementById('result-section');
    const generatedCode = document.getElementById('generatedCode');
    const copyCodeBtn = document.getElementById('copyCodeBtn');
    
    const codeInput = document.getElementById('codeInput');
    const retrieveBtn = document.getElementById('retrieveBtn');
    const retrievedSection = document.getElementById('retrieved-section');
    const retrievedData = document.getElementById('retrievedData');
    const copyRetrievedBtn = document.getElementById('copyRetrievedBtn');
    
    const clearBtn = document.getElementById('clearBtn');
    const pasteBtn = document.getElementById('pasteBtn');
    const themeToggle = document.getElementById('themeToggle');

    // Initialize theme
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.documentElement.setAttribute('data-theme', savedTheme);
    updateThemeToggle();

    // Theme toggle functionality
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            e.preventDefault();
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
            document.documentElement.setAttribute('data-theme', newTheme);
            localStorage.setItem('theme', newTheme);
            updateThemeToggle();
        });
    }

    function updateThemeToggle() {
        if (!themeToggle) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        const icon = themeToggle.querySelector('i');
        const text = themeToggle.querySelector('span');
        
        if (isDark) {
            icon.className = 'fas fa-sun';
            text.textContent = 'Light Mode';
        } else {
            icon.className = 'fas fa-moon';
            text.textContent = 'Dark Mode';
        }
    }

    // Stats update
    function updateStats() {
        if (!shareData || !charCount) return;
        const text = shareData.value;
        const chars = text.length;
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        
        charCount.textContent = `${chars} characters`;
        if (wordCount) {
            wordCount.textContent = `${words} words`;
        }
    }

    shareData.addEventListener('input', updateStats);

    // Clear button
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            shareData.value = '';
            updateStats();
            showToast('Editor cleared');
        });
    }

    // Paste button
    if (pasteBtn) {
        pasteBtn.addEventListener('click', async () => {
            try {
                const text = await navigator.clipboard.readText();
                shareData.value = text;
                updateStats();
                showToast('Text pasted from clipboard');
            } catch (error) {
                showToast('Failed to paste from clipboard', 'error');
            }
        });
    }    // Enhanced Toast notification system
    function showToast(message, type = 'success') {
        // Remove existing toasts of the same type
        const existingToasts = document.querySelectorAll(`.toast.${type}`);
        existingToasts.forEach(toast => toast.remove());
        
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        
        // Create toast content with icon
        const icon = type === 'success' ? '✅' : 
                    type === 'error' ? '❌' : 
                    type === 'warning' ? '⚠️' : '📌';
        
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">${icon}</span>
                <span class="toast-message">${message}</span>
            </div>
        `;
        
        // Add enhanced styling
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? 'rgba(16, 185, 129, 0.9)' : 
                        type === 'error' ? 'rgba(239, 68, 68, 0.9)' : 
                        type === 'warning' ? 'rgba(245, 158, 11, 0.9)' : 'rgba(59, 130, 246, 0.9)'};
            color: white;
            padding: 12px 20px;
            border-radius: 12px;
            font-weight: 500;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(10px);
            transform: translateX(400px);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: 10000;
            max-width: 350px;
            font-size: 14px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        document.body.appendChild(toast);
        
        // Animate in
        setTimeout(() => {
            toast.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove after delay
        const duration = type === 'error' ? 4000 : type === 'warning' ? 3500 : 3000;
        setTimeout(() => {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        }, duration);
        
        // Click to dismiss
        toast.addEventListener('click', () => {
            toast.style.transform = 'translateX(400px)';
            toast.style.opacity = '0';
            setTimeout(() => {
                if (toast.parentNode) {
                    toast.remove();
                }
            }, 300);
        });
    }// Enhanced Share functionality with retry logic
    shareBtn.addEventListener('click', async () => {
        const content = shareData.value.trim();
        
        if (!content) {
            showToast('Please enter some text to share', 'error');
            shareData.focus();
            return;
        }

        if (!navigator.onLine) {
            showToast('No internet connection. Please check your network.', 'error');
            return;
        }

        let retryCount = 0;
        const maxRetries = 3;
        
        const attemptShare = async () => {
            try {
                shareBtn.disabled = true;
                shareBtn.innerHTML = `
                    <div class="enhanced-loading">
                        <div class="spinner"></div>
                        <span>Generating...</span>
                    </div>
                `;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 10000);

                const response = await fetch('/api/share', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ content }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (response.ok) {
                    const result = await response.json();
                    generatedCode.textContent = result.code;
                    resultSection.style.display = 'block';
                    resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    showToast('Share code generated successfully! 🎉');
                    
                    // Add subtle success animation
                    resultSection.style.animation = 'popIn 0.5s ease-out';
                } else if (response.status === 429) {
                    throw new Error('Too many requests. Please wait a moment and try again.');
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again in a moment.');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to share content');
                }
            } catch (error) {
                console.error('Share error:', error);
                
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }
                
                if (retryCount < maxRetries && (
                    error.message.includes('network') || 
                    error.message.includes('timeout') ||
                    error.message.includes('Server error')
                )) {
                    retryCount++;
                    showToast(`Retrying... (${retryCount}/${maxRetries})`, 'warning');
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                    return attemptShare();
                }
                
                showToast(error.message || 'Failed to share content. Please try again.', 'error');
            } finally {
                shareBtn.disabled = false;
                shareBtn.innerHTML = '<i class="fas fa-share-alt"></i> Generate Code';
            }
        };

        await attemptShare();
    });

    // Copy code functionality
    copyCodeBtn.addEventListener('click', async () => {
        const code = generatedCode.textContent;
        try {
            await navigator.clipboard.writeText(code);
            showToast('Code copied to clipboard!');
        } catch (error) {
            showToast('Failed to copy code', 'error');
        }
    });    // Enhanced Retrieve functionality
    retrieveBtn.addEventListener('click', async () => {
        const code = codeInput.value.trim().toUpperCase();
        
        if (!code || code.length !== 4) {
            showToast('Please enter a valid 4-character code', 'error');
            codeInput.focus();
            return;
        }

        if (!navigator.onLine) {
            showToast('No internet connection. Please check your network.', 'error');
            return;
        }

        let retryCount = 0;
        const maxRetries = 3;
        
        const attemptRetrieve = async () => {
            try {
                retrieveBtn.disabled = true;
                retrieveBtn.innerHTML = `
                    <div class="enhanced-loading">
                        <div class="spinner"></div>
                        <span>Retrieving...</span>
                    </div>
                `;

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);

                const response = await fetch(`/api/share/${code}`, {
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);

                if (response.ok) {
                    const result = await response.json();
                    retrievedData.textContent = result.content;
                    retrievedSection.style.display = 'block';
                    retrievedSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    showToast('Content retrieved successfully! 📋');
                    
                    // Add success animation
                    retrievedSection.style.animation = 'slideUp 0.5s ease-out';
                    
                    // Update URL hash for sharing
                    window.history.replaceState(null, null, `#${code}`);
                } else if (response.status === 404) {
                    showToast('Code not found or expired. Please check the code.', 'error');
                    codeInput.focus();
                } else if (response.status === 429) {
                    throw new Error('Too many requests. Please wait a moment and try again.');
                } else if (response.status >= 500) {
                    throw new Error('Server error. Please try again in a moment.');
                } else {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.message || 'Failed to retrieve content');
                }
            } catch (error) {
                console.error('Retrieve error:', error);
                
                if (error.name === 'AbortError') {
                    throw new Error('Request timed out. Please try again.');
                }
                
                if (retryCount < maxRetries && (
                    error.message.includes('network') || 
                    error.message.includes('timeout') ||
                    error.message.includes('Server error')
                )) {
                    retryCount++;
                    showToast(`Retrying... (${retryCount}/${maxRetries})`, 'warning');
                    await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
                    return attemptRetrieve();
                }
                
                showToast(error.message || 'Failed to retrieve content. Please try again.', 'error');
            } finally {
                retrieveBtn.disabled = false;
                retrieveBtn.innerHTML = '<i class="fas fa-search"></i> Retrieve';
            }
        };

        await attemptRetrieve();
    });

    // Copy retrieved content
    copyRetrievedBtn.addEventListener('click', async () => {
        const content = retrievedData.textContent;
        try {
            await navigator.clipboard.writeText(content);
            showToast('Content copied to clipboard!');
        } catch (error) {
            showToast('Failed to copy content', 'error');
        }
    });

    // Auto-submit on 4 characters
    codeInput.addEventListener('input', (e) => {
        const code = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
        e.target.value = code;
        
        if (code.length === 4) {
            retrieveBtn.click();
        }
    });

    // Handle share code from URL
    const hash = window.location.hash;
    if (hash) {
        const code = hash.slice(1).toUpperCase();
        if (code.length === 4) {
            codeInput.value = code;
            retrieveBtn.click();
        }
    }

    // Initialize stats
    updateStats();
});

// Enhanced background animations and particle system
class BackgroundAnimations {
    constructor() {
        this.particles = [];
        this.particleContainer = null;
        this.init();
    }

    init() {
        this.createParticleContainer();
        this.createParticles();
        this.startAnimationLoop();
    }

    createParticleContainer() {
        this.particleContainer = document.createElement('div');
        this.particleContainer.className = 'particle-container';
        this.particleContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: -1;
        `;
        
        const backgroundCanvas = document.querySelector('.background-canvas');
        if (backgroundCanvas) {
            backgroundCanvas.appendChild(this.particleContainer);
        }
    }

    createParticles() {
        const particleCount = window.innerWidth > 768 ? 15 : 8;
        
        for (let i = 0; i < particleCount; i++) {
            this.createParticle();
        }
    }

    createParticle() {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random starting position
        const startX = Math.random() * window.innerWidth;
        const animationDuration = 15 + Math.random() * 10; // 15-25 seconds
        const delay = Math.random() * 20; // 0-20 seconds delay
        
        particle.style.cssText = `
            left: ${startX}px;
            animation-duration: ${animationDuration}s;
            animation-delay: ${delay}s;
        `;
        
        this.particleContainer.appendChild(particle);
        
        // Remove and recreate particle after animation
        setTimeout(() => {
            if (particle.parentNode) {
                particle.remove();
                this.createParticle();
            }
        }, (animationDuration + delay) * 1000);
    }

    startAnimationLoop() {
        // Add interactive effects based on user interaction
        document.addEventListener('mousemove', (e) => {
            this.handleMouseMove(e);
        });
        
        document.addEventListener('click', (e) => {
            this.handleClick(e);
        });
    }

    handleMouseMove(e) {
        const orbs = document.querySelectorAll('.gradient-orb');
        const mouseX = e.clientX / window.innerWidth;
        const mouseY = e.clientY / window.innerHeight;
        
        orbs.forEach((orb, index) => {
            const factor = (index + 1) * 0.5;
            const translateX = (mouseX - 0.5) * 20 * factor;
            const translateY = (mouseY - 0.5) * 20 * factor;
            
            orb.style.transform = `translate(${translateX}px, ${translateY}px)`;
        });
    }

    handleClick(e) {
        // Create ripple effect on click
        this.createRipple(e.clientX, e.clientY);
    }

    createRipple(x, y) {
        const ripple = document.createElement('div');
        ripple.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(59, 130, 246, 0.2) 0%, transparent 70%);
            pointer-events: none;
            z-index: -1;
            animation: rippleEffect 1s ease-out forwards;
        `;
        
        document.body.appendChild(ripple);
        
        // Remove ripple after animation
        setTimeout(() => ripple.remove(), 1000);
    }
}

// Enhanced QuickShare functionality with better error handling
class QuickShareApp {
    constructor() {
        this.backgroundAnimations = null;
        this.isOnline = navigator.onLine;
        this.retryAttempts = 0;
        this.maxRetries = 3;
        this.baseURL = window.location.origin;
        this.init();
    }

    init() {
        // Initialize background animations
        if (document.querySelector('.background-canvas')) {
            this.backgroundAnimations = new BackgroundAnimations();
        }
        
        // Add connection status monitoring
        this.setupConnectionMonitoring();
        
        // Add enhanced error handling CSS
        this.addErrorHandlingStyles();
        
        // Initialize with enhanced functionality
        this.initializeApp();
    }

    setupConnectionMonitoring() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showToast('Connection restored', 'success');
            this.updateUIForConnection(true);
        });
        
        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showToast('Connection lost. Check your internet.', 'error');
            this.updateUIForConnection(false);
        });
    }

    updateUIForConnection(isOnline) {
        const shareBtn = document.getElementById('shareBtn');
        const retrieveBtn = document.getElementById('retrieveBtn');
        
        if (shareBtn) {
            shareBtn.disabled = !isOnline;
            shareBtn.title = isOnline ? 'Generate share code' : 'No internet connection';
        }
        
        if (retrieveBtn) {
            retrieveBtn.disabled = !isOnline;
            retrieveBtn.title = isOnline ? 'Retrieve content' : 'No internet connection';
        }
    }

    addErrorHandlingStyles() {
        const style = document.createElement('style');
        style.textContent = `
            @keyframes rippleEffect {
                0% {
                    width: 0;
                    height: 0;
                    opacity: 1;
                }
                100% {
                    width: 200px;
                    height: 200px;
                    margin-left: -100px;
                    margin-top: -100px;
                    opacity: 0;
                }
            }
            
            .connection-status {
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 12px;
                font-weight: 500;
                z-index: 1000;
                transition: all 0.3s ease;
            }
            
            .connection-status.online {
                background: rgba(16, 185, 129, 0.1);
                color: var(--secondary);
                border: 1px solid rgba(16, 185, 129, 0.2);
            }
            
            .connection-status.offline {
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
                border: 1px solid rgba(239, 68, 68, 0.2);
            }
            
            .enhanced-loading {
                display: inline-flex;
                align-items: center;
                gap: 8px;
            }
            
            .enhanced-loading .spinner {
                width: 16px;
                height: 16px;
                border: 2px solid rgba(255, 255, 255, 0.3);
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }
        `;
        document.head.appendChild(style);
    }

    async enhancedFetch(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            
            if (error.name === 'AbortError') {
                throw new Error('Request timed out. Please try again.');
            }
            
            if (!this.isOnline) {
                throw new Error('No internet connection. Please check your network.');
            }
            
            throw error;
        }
    }

    initializeApp() {
        // Add connection status indicator
    function createConnectionStatus() {
        const statusEl = document.createElement('div');
        statusEl.className = 'connection-status';
        statusEl.innerHTML = `
            <i class="fas fa-wifi"></i>
            <span>Connected</span>
        `;
        document.body.appendChild(statusEl);
        
        function updateStatus(isOnline) {
            statusEl.className = `connection-status ${isOnline ? 'online' : 'offline'}`;
            statusEl.innerHTML = `
                <i class="fas fa-${isOnline ? 'wifi' : 'wifi-slash'}"></i>
                <span>${isOnline ? 'Connected' : 'Offline'}</span>
            `;
        }
        
        updateStatus(navigator.onLine);
        
        window.addEventListener('online', () => updateStatus(true));
        window.addEventListener('offline', () => updateStatus(false));
        
        // Auto-hide after 3 seconds if online
        if (navigator.onLine) {
            setTimeout(() => {
                statusEl.style.opacity = '0';
                setTimeout(() => statusEl.remove(), 300);
            }, 3000);
        }
    }

    // Add smooth scroll behavior for result sections
    function enhanceResultSections() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animation = 'slideUp 0.6s ease-out';
                }
            });
        }, {
            threshold: 0.1,
            rootMargin: '50px'
        });
        
        if (resultSection) observer.observe(resultSection);
        if (retrievedSection) observer.observe(retrievedSection);
    }

    // Add keyboard shortcuts
    function setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + Enter to share
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && document.activeElement === shareData) {
                e.preventDefault();
                shareBtn.click();
            }
            
            // Escape to clear
            if (e.key === 'Escape') {
                if (resultSection && resultSection.style.display === 'block') {
                    resultSection.style.display = 'none';
                }
                if (retrievedSection && retrievedSection.style.display === 'block') {
                    retrievedSection.style.display = 'none';
                }
                shareData.focus();
            }
            
            // Ctrl/Cmd + L to focus code input
            if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
                e.preventDefault();
                codeInput.focus();
            }
        });
    }

    // Add visual feedback for form interactions
    function enhanceFormInteractions() {
        // Add focus glow effect
        [shareData, codeInput].forEach(input => {
            if (input) {
                input.addEventListener('focus', () => {
                    input.closest('.form-group')?.classList.add('glow-effect');
                });
                
                input.addEventListener('blur', () => {
                    input.closest('.form-group')?.classList.remove('glow-effect');
                });
            }
        });
        
        // Add pulse effect to buttons when ready
        if (shareBtn && shareData) {
            shareData.addEventListener('input', () => {
                if (shareData.value.trim().length > 0) {
                    shareBtn.classList.add('pulse-animation');
                } else {
                    shareBtn.classList.remove('pulse-animation');
                }
            });
        }
    }

    // Initialize all enhancements
    function initializeEnhancements() {
        createConnectionStatus();
        enhanceResultSections();
        setupKeyboardShortcuts();
        enhanceFormInteractions();
        
        // Add loading indicator for initial page load
        document.body.style.opacity = '0';
        document.body.style.transition = 'opacity 0.5s ease';
        
        setTimeout(() => {
            document.body.style.opacity = '1';
        }, 100);
        
        // Add welcome message
        setTimeout(() => {
            showToast('Welcome to QuickText Pro! 🚀', 'info');
        }, 1000);
    }

    // Initialize all enhancements
    initializeEnhancements();
    }
}

// Add ripple effect keyframes to the document
const rippleStyles = document.createElement('style');
rippleStyles.textContent = `
    @keyframes rippleEffect {
        0% {
            width: 0;
            height: 0;
            opacity: 1;
        }
        100% {
            width: 200px;
            height: 200px;
            margin-left: -100px;
            margin-top: -100px;
            opacity: 0;
        }
    }
`;
document.head.appendChild(rippleStyles);

// Initialize enhanced QuickShare app
let quickShareApp;
