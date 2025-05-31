// QuickText Pro - Alpine.js Integration

// Alpine.js Data Component
function quickTextApp() {
    return {
        // State
        shareContent: '',
        retrieveCode: '',
        retrievePassword: '',
        shareResult: null,
        retrievedContent: null,
        isLoading: {
            share: false,
            retrieve: false
        },
        showAdvanced: false,
        showPasswordPrompt: false,
        showPassword: false,        showRetrievePassword: false,        isDragging: false,
        isConnected: false,
        
        // Settings
        settings: {
            contentType: 'text',
            language: '',
            expiry: '15m',
            maxViews: '',
            password: '',
            oneTimeAccess: false
        },
        
        // Socket connection
        socket: null,
          // Initialize
        init() {
            this.initializeSocket();
            this.checkUrlForCode();
            this.initAstroBackground();        },
        
        // Initialize WebSocket connection
        initializeSocket() {
            try {
                this.socket = io();
                this.socket.on('connect', () => {
                    console.log('Connected to server');
                    this.isConnected = true;
                });
                
                this.socket.on('disconnect', () => {
                    console.log('Disconnected from server');
                    this.isConnected = false;
                });

                this.socket.on('content-updated', (data) => {
                    if (this.retrievedContent && data.code === this.retrieveCode) {
                        this.retrievedContent.content = data.content;
                        this.highlightCode();
                        this.showNotification('Content updated in real-time!', 'info');
                    }                });
            } catch (error) {
                console.warn('WebSocket connection failed:', error);
            }
        },
        
        // Check URL for share code
        checkUrlForCode() {
            const params = new URLSearchParams(window.location.search);
            const code = params.get('code');
            
            if (code && code.length === 4) {
                this.retrieveCode = code.toUpperCase();
                this.retrieveContent();
            }
        },
        
        // Generate a share code
        async generateCode() {
            if (!this.shareContent.trim()) {
                this.showNotification('Please enter some content to share', 'error');
                return;
            }
            
            this.isLoading.share = true;
            
            try {
                const payload = {
                    content: this.shareContent,
                    contentType: this.settings.contentType,
                    language: this.settings.contentType === 'code' ? this.settings.language : null,
                    duration: this.settings.expiry,
                    maxViews: this.settings.maxViews || null,
                    password: this.settings.password || null,
                    oneTimeAccess: this.settings.oneTimeAccess
                };
                
                const response = await fetch('/api/share', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to create share');
                }
                
                // Format the result
                this.shareResult = {
                    code: data.code,
                    url: `${window.location.origin}/?code=${data.code}`,
                    expires: this.formatExpiryTime(this.settings.expiry),
                    views: 0,
                    hasPassword: !!this.settings.password,
                    oneTimeAccess: this.settings.oneTimeAccess
                };
                
                // Generate QR code
                this.$nextTick(() => {
                    this.generateQRCode(this.shareResult.url);
                });
                
                // Join socket room for updates
                if (this.socket) {
                    this.socket.emit('join-share', data.code);
                }
                
                this.showNotification('Share code created successfully!', 'success');
            } catch (error) {
                this.showNotification('Error: ' + error.message, 'error');
            } finally {
                this.isLoading.share = false;
            }
        },
        
        // Retrieve shared content using a code
        async retrieveContent() {
            if (!this.retrieveCode || this.retrieveCode.length !== 4) {
                this.showNotification('Please enter a 4-character code', 'error');
                return;
            }
            
            this.isLoading.retrieve = true;
            
            try {
                const response = await fetch(`/api/retrieve/${this.retrieveCode}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: this.retrievePassword || null })
                });
                
                const data = await response.json();
                
                if (response.status === 401 && data.requiresPassword) {
                    this.showPasswordPrompt = true;
                    this.showNotification('This content requires a password', 'info');
                    return;
                }
                
                if (!response.ok) {
                    throw new Error(data.message || 'Failed to retrieve content');
                }
                  this.retrievedContent = {
                    content: data.content,
                    type: data.contentType || 'text',
                    language: data.language || 'text',
                    views: data.views || 1
                };
                
                console.log('Retrieved content with views:', data.views);
                console.log('Assigned views to retrievedContent:', this.retrievedContent.views);
                
                // Apply syntax highlighting if it's code
                this.$nextTick(() => {
                    this.highlightCode();
                });
                
                // Join socket room for updates
                if (this.socket) {
                    this.socket.emit('join-share', this.retrieveCode);
                }
                
                this.showPasswordPrompt = false;
                this.showNotification('Content retrieved successfully!', 'success');
            } catch (error) {
                this.showNotification('Error: ' + error.message, 'error');
            } finally {
                this.isLoading.retrieve = false;
            }
        },
        
        // Submit password for protected share
        async submitPassword() {
            if (!this.retrievePassword) {
                this.showNotification('Please enter the password', 'error');
                return;
            }
            
            await this.retrieveContent();
        },
        
        // Cancel password prompt
        cancelPassword() {
            this.showPasswordPrompt = false;
            this.retrievePassword = '';
        },
        
        // Apply syntax highlighting to retrieved code
        highlightCode() {
            if (this.retrievedContent && this.retrievedContent.type === 'code' && window.Prism) {
                const codeElement = document.querySelector('pre code');
                if (codeElement) {
                    Prism.highlightElement(codeElement);
                }
            }
        },
        
        // Format expiry time for display
        formatExpiryTime(duration) {
            const map = {
                '5m': '5 minutes',
                '15m': '15 minutes',
                '30m': '30 minutes',
                '1h': '1 hour'
            };
            return map[duration] || '15 minutes';
        },
        
        // Update text stats
        updateStats() {
            return {
                chars: this.shareContent.length,
                words: this.shareContent.trim() ? this.shareContent.trim().split(/\s+/).filter(w => w.length > 0).length : 0
            };
        },
        
        // Clear content
        clearContent() {
            this.shareContent = '';
            this.shareResult = null;
            this.showNotification('Content cleared', 'info');
        },        // Generate QR Code for sharing
        generateQRCode(url) {
            // Add a small delay to ensure the DOM is updated
            this.$nextTick(() => {
                const qrcodeElement = this.$refs.qrcode;
                if (qrcodeElement && window.QRious) {
                    // Clear previous QR code
                    qrcodeElement.innerHTML = '';
                    
                    // Create canvas element
                    const canvas = document.createElement('canvas');
                    qrcodeElement.appendChild(canvas);
                    
                    // Generate QR code
                    try {
                        const qr = new QRious({
                            element: canvas,
                            value: url,
                            size: 120,
                            foreground: '#000000',
                            background: '#ffffff'
                        });
                        console.log('QR Code generated successfully for:', url);
                    } catch (error) {
                        console.error('QR Code generation failed:', error);
                        qrcodeElement.innerHTML = '<div class="text-red-500 text-xs">QR generation failed</div>';
                    }
                } else {
                    console.warn('QR Code generation skipped: element or QRious library not found');
                    if (qrcodeElement) {
                        qrcodeElement.innerHTML = '<div class="text-gray-500 text-xs">QR unavailable</div>';
                    }
                }
            });
        },
        
        // Copy text to clipboard
        async copyToClipboard(text) {
            try {
                await navigator.clipboard.writeText(text);
                this.showNotification('Copied to clipboard!', 'success');
            } catch (error) {
                this.showNotification('Failed to copy to clipboard', 'error');
            }
        },
        
        // Paste from clipboard
        async pasteFromClipboard() {
            try {
                const text = await navigator.clipboard.readText();
                this.shareContent = text;
                this.showNotification('Content pasted from clipboard', 'success');
            } catch (error) {
                this.showNotification('Failed to paste from clipboard', 'error');
            }
        },
        
        // Format content (JSON or code)
        formatContent() {
            if (!this.shareContent.trim()) return;
            
            try {
                // Try to format as JSON
                const json = JSON.parse(this.shareContent);
                this.shareContent = JSON.stringify(json, null, 2);
                this.settings.contentType = 'code';
                this.settings.language = 'json';
                this.showNotification('Formatted as JSON', 'success');
            } catch (e) {
                // Basic indent formatting for code
                this.shareContent = this.shareContent
                    .split('\n')
                    .map(line => line.trimEnd())
                    .join('\n');
                this.showNotification('Basic formatting applied', 'info');
            }
        },
        
        // Handle file selection
        async handleFileSelect(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            await this.processFile(file);
        },
        
        // Handle file drop
        async handleFileDrop(event) {
            const files = event.dataTransfer.files;
            if (files.length > 0) {
                await this.processFile(files[0]);
            }
            this.isDragging = false;
        },
          // Process uploaded file
        async processFile(file) {
            const maxSize = 10 * 1024 * 1024; // Increased to 10MB for PDFs
            if (file.size > maxSize) {
                this.showNotification('File too large (max 10MB)', 'error');
                return;
            }
            
            try {
                const extension = file.name.split('.').pop().toLowerCase();
                
                // Handle different file types
                if (['pdf'].includes(extension)) {
                    const base64 = await this.fileToBase64(file);
                    this.shareContent = `[PDF File: ${file.name}]\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: PDF Document\n\nFile Data: ${base64}`;
                    this.settings.contentType = 'text';
                } else if (['doc', 'docx', 'rtf'].includes(extension)) {
                    const base64 = await this.fileToBase64(file);
                    this.shareContent = `[Document File: ${file.name}]\nSize: ${(file.size / 1024).toFixed(1)} KB\nType: ${extension.toUpperCase()} Document\n\nFile Data: ${base64}`;
                    this.settings.contentType = 'text';
                } else {
                    // Text files
                    const content = await this.readFileContent(file);
                    this.shareContent = content;
                    this.detectFileLanguage(file.name);
                }
                
                this.showNotification(`File "${file.name}" loaded`, 'success');
            } catch (error) {
                this.showNotification('Error reading file', 'error');
            }
        },
          // Read file content
        readFileContent(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to read file'));
                reader.readAsText(file);
            });
        },

        // Convert file to base64
        fileToBase64(file) {
            return new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = e => resolve(e.target.result);
                reader.onerror = () => reject(new Error('Failed to convert file to base64'));
                reader.readAsDataURL(file);
            });
        },
        
        // Detect language from file extension
        detectFileLanguage(filename) {
            const extension = filename.split('.').pop().toLowerCase();
            const languageMap = {
                'js': 'javascript',
                'ts': 'javascript',
                'jsx': 'javascript',
                'tsx': 'javascript',
                'py': 'python',
                'java': 'java',
                'c': 'cpp',
                'cpp': 'cpp',
                'h': 'cpp',
                'css': 'css',
                'html': 'html',
                'xml': 'xml',
                'json': 'json',
                'sql': 'sql',
                'md': 'markdown'
            };
            
            if (languageMap[extension]) {
                this.settings.contentType = 'code';
                this.settings.language = languageMap[extension];
            } else {
                this.settings.contentType = 'text';
            }        },
        
        // Download retrieved content
        downloadContent() {
            if (!this.retrievedContent) return;
            
            const content = this.retrievedContent.content;
            
            // Check if content contains base64 file data with new format
            const pdfMatch = content.match(/📄 PDF File: (.+?)\n[\s\S]*?\[FILE_DATA:(data:application\/pdf;base64,[^\]]+)\]/);
            const docMatch = content.match(/📄 Document File: (.+?)\n[\s\S]*?\[FILE_DATA:(data:application\/[^;]+;base64,[^\]]+)\]/);
            
            if (pdfMatch) {
                const [, filename, base64Data] = pdfMatch;
                this.downloadFromBase64(base64Data, filename, 'application/pdf');
                return;
            } else if (docMatch) {
                const [, filename, base64Data] = docMatch;
                const mimeType = base64Data.split(';')[0].split(':')[1];
                this.downloadFromBase64(base64Data, filename, mimeType);
                return;
            }
            
            // Download as regular text file
            const language = this.retrievedContent.language;
            
            const extensionMap = {
                'javascript': 'js',
                'python': 'py',
                'java': 'java',
                'cpp': 'cpp',
                'css': 'css',
                'html': 'html',
                'xml': 'xml',
                'json': 'json',
                'sql': 'sql',
                'markdown': 'md'
            };
            
            const extension = extensionMap[language] || 'txt';
            const filename = `quicktext_${this.retrieveCode}.${extension}`;
            
            const blob = new Blob([content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification(`Downloaded as ${filename}`, 'success');
        },

        // Helper function to download file from base64 data
        downloadFromBase64(base64Data, filename, mimeType) {
            try {
                // Convert base64 to blob
                const byteCharacters = atob(base64Data.split(',')[1]);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const blob = new Blob([byteArray], { type: mimeType });

                // Create download link
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = filename;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
                
                this.showNotification(`File "${filename}" downloaded successfully!`, 'success');
            } catch (error) {
                console.error('Download error:', error);
                this.showNotification('Failed to download file. It may be corrupted.', 'error');
            }
        },
        
        // Show notification
        showNotification(message, type = 'info') {
            const types = {
                success: { icon: 'fa-check-circle', color: 'bg-green-500' },
                error: { icon: 'fa-exclamation-circle', color: 'bg-red-500' },
                info: { icon: 'fa-info-circle', color: 'bg-blue-500' },
                warning: { icon: 'fa-exclamation-triangle', color: 'bg-yellow-500' }
            };
            
            // Create notification element
            const notification = document.createElement('div');
            notification.className = `fixed top-4 right-4 z-50 glass-light px-4 py-3 rounded-lg flex items-center animate-scale-in transform transition-all duration-300 shadow-lg`;
            
            notification.innerHTML = `
                <div class="w-8 h-8 ${types[type].color} rounded-full flex items-center justify-center mr-3">
                    <i class="fas ${types[type].icon} text-white"></i>
                </div>
                <p class="text-white">${message}</p>
            `;
            
            document.body.appendChild(notification);
            
            // Remove after delay
            setTimeout(() => {
                notification.classList.add('opacity-0');
                setTimeout(() => document.body.removeChild(notification), 300);
            }, 3000);
        },
        
        // Initialize cosmic background effects
        initAstroBackground() {
            // Create meteors every few seconds
            setInterval(() => {
                const meteor = document.createElement('div');
                meteor.className = 'meteor fixed top-0 left-0 z-0';
                meteor.style.animationDelay = Math.random() * 10 + 's';
                document.body.appendChild(meteor);
                
                setTimeout(() => {
                    document.body.removeChild(meteor);
                }, 3000); // Remove after animation completes
            }, 5000);
            
            // Create interactive particles on mouse movement
            document.addEventListener('mousemove', this.throttle((e) => {
                if (Math.random() > 0.85) { // Only create particles occasionally
                    this.createInteractiveParticle(e.clientX, e.clientY);
                }
            }, 50));
        },
        
        // Create interactive particle
        createInteractiveParticle(x, y) {
            const particle = document.createElement('div');
            const size = Math.random() * 3 + 1;
            const duration = Math.random() * 2 + 1;
            
            particle.style.cssText = `
                position: fixed;
                left: ${x}px;
                top: ${y}px;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255,255,255,${Math.random() * 0.7 + 0.3});
                border-radius: 50%;
                pointer-events: none;
                z-index: 1;
                opacity: 1;
                transition: all ${duration}s ease-out;
            `;
            
            document.body.appendChild(particle);
            
            // Animate particle
            setTimeout(() => {
                particle.style.transform = `translate(${(Math.random() - 0.5) * 100}px, ${-Math.random() * 100}px)`;
                particle.style.opacity = '0';
            }, 10);
            
            setTimeout(() => {
                document.body.removeChild(particle);
            }, duration * 1000);
        },
        
        // Throttle function to limit execution rate
        throttle(func, limit) {
            let lastFunc;
            let lastRan;
            return function() {
                const context = this;
                const args = arguments;
                if (!lastRan) {
                    func.apply(context, args);
                    lastRan = Date.now();
                } else {
                    clearTimeout(lastFunc);
                    lastFunc = setTimeout(function() {
                        if ((Date.now() - lastRan) >= limit) {
                            func.apply(context, args);
                            lastRan = Date.now();
                        }
                    }, limit - (Date.now() - lastRan));
                }
            };
        }
    };
}

// Legacy QuickTextPro class for backward compatibility
class QuickTextPro {
    constructor() {
        this.socket = null;
        this.currentShareCode = null;        this.initializeSocket();
        this.initializeEventListeners();
        this.initializeDragAndDrop();
        this.startBackgroundAnimations();
    }

    // Initialize WebSocket connection
    initializeSocket() {
        try {
            this.socket = io();
            this.socket.on('connect', () => {
                console.log('Connected to server');
            });

            this.socket.on('content-updated', (data) => {
                this.handleRealtimeUpdate(data);
            });
        } catch (error) {
            console.warn('WebSocket connection failed:', error);
        }
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Share button
        document.getElementById('shareBtn').addEventListener('click', () => this.shareContent());
        
        // Retrieve button
        document.getElementById('retrieveBtn').addEventListener('click', () => this.retrieveContent());
        
        // Advanced options toggle
        document.getElementById('optionsToggle')?.addEventListener('click', () => this.toggleAdvancedOptions());
        
        // Password toggles
        document.getElementById('passwordToggle')?.addEventListener('click', () => this.togglePasswordVisibility('passwordInput', 'passwordToggle'));
        document.getElementById('retrievePasswordToggle')?.addEventListener('click', () => this.togglePasswordVisibility('retrievePasswordInput', 'retrievePasswordToggle'));
        
        // Password prompt actions
        document.getElementById('submitPasswordBtn')?.addEventListener('click', () => this.submitPassword());
        document.getElementById('cancelPasswordBtn')?.addEventListener('click', () => this.cancelPasswordPrompt());
        
        // Copy buttons
        document.getElementById('copyCodeBtn').addEventListener('click', () => this.copyToClipboard('generatedCode'));
        document.getElementById('copyUrlBtn')?.addEventListener('click', () => this.copyToClipboard('shareUrl'));
        document.getElementById('copyRetrievedBtn')?.addEventListener('click', () => this.copyRetrievedContent());
        
        // Download button
        document.getElementById('downloadBtn')?.addEventListener('click', () => this.downloadContent());
        
        // Clear and paste buttons
        document.getElementById('clearBtn').addEventListener('click', () => this.clearContent());
        document.getElementById('pasteBtn').addEventListener('click', () => this.pasteFromClipboard());
        document.getElementById('formatBtn')?.addEventListener('click', () => this.autoFormatContent());
        
        // Content type change
        document.getElementById('contentTypeSelect')?.addEventListener('change', () => this.handleContentTypeChange());
        
        // Textarea events
        const textarea = document.getElementById('shareData');
        textarea.addEventListener('input', () => this.updateStats());
        textarea.addEventListener('keydown', (e) => this.handleKeyDown(e));
        
        // Code input events
        const codeInput = document.getElementById('codeInput');
        codeInput.addEventListener('input', (e) => this.formatCodeInput(e));
        codeInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.retrieveContent();
        });
          // Password input events
        document.getElementById('retrievePasswordInput')?.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') this.submitPassword();
        });
        
        // File input
        document.getElementById('fileInput')?.addEventListener('change', (e) => this.handleFileSelect(e));
        
        // Initialize stats
        this.updateStats();
    }

    // Initialize drag and drop functionality
    initializeDragAndDrop() {
        const dropZone = document.getElementById('dropZone');
        const textarea = document.getElementById('shareData');

        if (!dropZone) return;

        ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, this.preventDefaults, false);
            document.body.addEventListener(eventName, this.preventDefaults, false);
        });

        ['dragenter', 'dragover'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.add('drag-active'), false);
        });

        ['dragleave', 'drop'].forEach(eventName => {
            dropZone.addEventListener(eventName, () => dropZone.classList.remove('drag-active'), false);
        });

        dropZone.addEventListener('drop', (e) => this.handleDrop(e), false);
        dropZone.addEventListener('click', () => document.getElementById('fileInput').click());
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Handle file drop
    async handleDrop(e) {
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            await this.processFile(files[0]);
        }
    }

    // Handle file selection
    async handleFileSelect(e) {
        if (e.target.files.length > 0) {
            await this.processFile(e.target.files[0]);
        }
    }    // Process uploaded file
    async processFile(file) {
        const maxSize = 10 * 1024 * 1024; // Increased to 10MB for PDFs and documents
        if (file.size > maxSize) {
            this.showNotification('File too large. Maximum size is 10MB.', 'error');
            return;
        }

        try {
            const extension = file.name.split('.').pop().toLowerCase();
            let content;
              // Handle different file types
            if (['pdf'].includes(extension)) {
                const base64 = await this.fileToBase64(file);
                // Store base64 data separately and show clean display
                content = `📄 PDF File: ${file.name}
📊 Size: ${(file.size / 1024).toFixed(1)} KB
📅 Uploaded: ${new Date().toLocaleString()}
🔗 Type: PDF Document

📋 This is a PDF file that can be downloaded after sharing.
🎯 Share this content to allow others to download the original PDF file.

[FILE_DATA:${base64}]`;
            } else if (['doc', 'docx', 'rtf'].includes(extension)) {
                const base64 = await this.fileToBase64(file);
                // Store base64 data separately and show clean display
                content = `📄 Document File: ${file.name}
📊 Size: ${(file.size / 1024).toFixed(1)} KB
📅 Uploaded: ${new Date().toLocaleString()}
🔗 Type: ${extension.toUpperCase()} Document

📋 This is a document file that can be downloaded after sharing.
🎯 Share this content to allow others to download the original document file.

[FILE_DATA:${base64}]`;
            } else {
                // Text files
                content = await this.readFileContent(file);
            }
            
            document.getElementById('shareData').value = content;
            
            // Auto-detect content type and language
            this.autoDetectLanguage(content, extension);
            
            this.updateStats();
            this.showNotification(`File "${file.name}" loaded successfully!`, 'success');
        } catch (error) {
            this.showNotification('Error reading file: ' + error.message, 'error');
        }
    }

    // Convert file to base64
    fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = e => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to convert file to base64'));
            reader.readAsDataURL(file);
        });
    }

    // Read file content
    readFileContent(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    // Auto-detect language based on content and file extension
    autoDetectLanguage(content, extension) {
        const contentTypeSelect = document.getElementById('contentTypeSelect');
        const languageSelect = document.getElementById('languageSelect');
        
        if (!contentTypeSelect || !languageSelect) return;

        const codeExtensions = ['js', 'py', 'java', 'cpp', 'css', 'html', 'sql', 'json', 'xml', 'ts', 'jsx', 'tsx'];
        
        if (codeExtensions.includes(extension)) {
            contentTypeSelect.value = 'code';
            
            const languageMap = {
                'js': 'javascript',
                'ts': 'javascript',
                'jsx': 'javascript',
                'tsx': 'javascript',
                'py': 'python',
                'java': 'java',
                'cpp': 'cpp',
                'c': 'cpp',
                'css': 'css',
                'html': 'html',
                'sql': 'sql',
                'json': 'json',
                'xml': 'xml'
            };
            
            if (languageMap[extension]) {
                languageSelect.value = languageMap[extension];
            }
        }
    }

    // Toggle advanced options
    toggleAdvancedOptions() {
        const content = document.getElementById('optionsContent');
        const toggle = document.getElementById('optionsToggle');
        const icon = toggle.querySelector('.fa-chevron-down, .fa-chevron-up');
        
        content.classList.toggle('active');
        icon.classList.toggle('fa-chevron-down');
        icon.classList.toggle('fa-chevron-up');
    }

    // Toggle password visibility
    togglePasswordVisibility(inputId, toggleId) {
        const input = document.getElementById(inputId);
        const toggle = document.getElementById(toggleId);
        const icon = toggle.querySelector('i');
        
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }

    // Handle content type change
    handleContentTypeChange() {
        const contentType = document.getElementById('contentTypeSelect').value;
        const languageGroup = document.querySelector('.option-group:has(#languageSelect)');
        
        if (languageGroup) {
            languageGroup.style.display = contentType === 'code' ? 'block' : 'none';
        }
    }

    // Update character and word count
    updateStats() {
        const content = document.getElementById('shareData').value;
        const charCount = content.length;
        const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
        
        document.querySelector('.char-count').textContent = `${charCount} characters`;
        document.getElementById('wordCount').textContent = `${wordCount} words`;
    }

    // Handle keyboard shortcuts
    handleKeyDown(e) {
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            this.shareContent();
        }
    }

    // Format code input (auto-uppercase)
    formatCodeInput(e) {
        const input = e.target;
        input.value = input.value.toUpperCase();
    }

    // Share content with advanced options
    async shareContent() {
        const content = document.getElementById('shareData').value.trim();
        
        if (!content) {
            this.showNotification('Please enter some content to share', 'error');
            return;
        }

        const shareBtn = document.getElementById('shareBtn');
        const originalText = shareBtn.innerHTML;
        
        try {
            shareBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Creating...</span>';
            shareBtn.disabled = true;

            const shareData = {
                content,
                duration: document.getElementById('expirySelect')?.value || '15m',
                contentType: document.getElementById('contentTypeSelect')?.value || 'text',
                language: document.getElementById('languageSelect')?.value || undefined,
                oneTimeAccess: document.getElementById('oneTimeAccess')?.checked || false,
                maxViews: parseInt(document.getElementById('maxViewsInput')?.value) || undefined
            };

            const password = document.getElementById('passwordInput')?.value;
            if (password) {
                shareData.password = password;
            }

            const response = await fetch('/api/share', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(shareData)
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to create share');
            }

            this.displayShareResult(data);
            this.generateQRCode(data.code);
            
        } catch (error) {
            this.showNotification('Error: ' + error.message, 'error');
        } finally {
            shareBtn.innerHTML = originalText;
            shareBtn.disabled = false;
        }
    }

    // Display share result
    displayShareResult(data) {
        this.currentShareCode = data.code;
        
        document.getElementById('generatedCode').textContent = data.code;
        document.getElementById('result-section').style.display = 'block';
        
        // Update expiry display
        const expiryText = this.formatExpiryTime(data.duration || '15m');
        document.getElementById('expiryDisplay').textContent = expiryText;
        
        // Show/hide additional stats
        const passwordStat = document.getElementById('passwordStat');
        const oneTimeStat = document.getElementById('oneTimeStat');
        
        if (passwordStat) {
            passwordStat.style.display = data.hasPassword ? 'flex' : 'none';
        }
        
        if (oneTimeStat) {
            oneTimeStat.style.display = data.oneTimeAccess ? 'flex' : 'none';
        }
        
        // Set share URL
        const shareUrl = `${window.location.origin}/?code=${data.code}`;
        const shareUrlInput = document.getElementById('shareUrl');
        if (shareUrlInput) {
            shareUrlInput.value = shareUrl;
        }
        
        // Join WebSocket room for real-time updates
        if (this.socket) {
            this.socket.emit('join-share', data.code);
        }
        
        this.showNotification('Share created successfully!', 'success');
    }    // Generate QR code
    generateQRCode(code) {
        const qrContainer = document.getElementById('qrcode');
        if (!qrContainer) {
            console.warn('QR container not found');
            return;
        }
        
        if (typeof QRious === 'undefined') {
            console.warn('QRious library not loaded');
            qrContainer.innerHTML = '<div class="text-gray-500 text-xs p-2">QR library not available</div>';
            return;
        }
        
        try {
            qrContainer.innerHTML = '';
            const shareUrl = `${window.location.origin}/?code=${code}`;
            
            // Create canvas element for QR code
            const canvas = document.createElement('canvas');
            qrContainer.appendChild(canvas);
            
            const qr = new QRious({
                element: canvas,
                value: shareUrl,
                size: 150,
                foreground: '#1a1a1a',
                background: '#ffffff'
            });
            
            console.log('Legacy QR Code generated for:', shareUrl);
        } catch (error) {
            console.error('QR Code generation failed:', error);
            qrContainer.innerHTML = '<div class="text-red-500 text-xs p-2">QR generation failed</div>';
        }
    }

    // Format expiry time for display
    formatExpiryTime(duration) {
        const map = {
            '5m': 'Expires in 5 minutes',
            '15m': 'Expires in 15 minutes',
            '30m': 'Expires in 30 minutes',
            '1h': 'Expires in 1 hour'
        };
        return map[duration] || 'Expires in 15 minutes';
    }

    // Retrieve content
    async retrieveContent() {
        const code = document.getElementById('codeInput').value.trim().toUpperCase();
        
        if (!code || code.length !== 4) {
            this.showNotification('Please enter a valid 4-character code', 'error');
            return;
        }

        const retrieveBtn = document.getElementById('retrieveBtn');
        const originalText = retrieveBtn.innerHTML;
        
        try {
            retrieveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Retrieving...</span>';
            retrieveBtn.disabled = true;            const response = await fetch(`/api/share/${code}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: null })
            });

            const data = await response.json();

            if (response.status === 401 && data.requiresPassword) {
                this.showPasswordPrompt(code);
                return;
            }

            if (!response.ok) {
                throw new Error(data.error || 'Failed to retrieve content');
            }

            this.displayRetrievedContent(data);
            
        } catch (error) {
            this.showNotification('Error: ' + error.message, 'error');
        } finally {
            retrieveBtn.innerHTML = originalText;
            retrieveBtn.disabled = false;
        }
    }

    // Show password prompt
    showPasswordPrompt(code) {
        this.pendingCode = code;
        document.getElementById('passwordPrompt').style.display = 'block';
        document.getElementById('retrievePasswordInput').focus();
    }

    // Submit password for protected share
    async submitPassword() {
        const password = document.getElementById('retrievePasswordInput').value;
        const code = this.pendingCode;
        
        if (!password) {
            this.showNotification('Please enter the password', 'error');
            return;
        }

        const submitBtn = document.getElementById('submitPasswordBtn');
        const originalText = submitBtn.innerHTML;
        
        try {
            submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i><span>Unlocking...</span>';
            submitBtn.disabled = true;

            const response = await fetch(`/api/share/${code}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Invalid password');
            }

            this.cancelPasswordPrompt();
            this.displayRetrievedContent(data);
            
        } catch (error) {
            this.showNotification('Error: ' + error.message, 'error');
        } finally {
            submitBtn.innerHTML = originalText;
            submitBtn.disabled = false;
        }
    }

    // Cancel password prompt
    cancelPasswordPrompt() {
        document.getElementById('passwordPrompt').style.display = 'none';
        document.getElementById('retrievePasswordInput').value = '';
        this.pendingCode = null;
    }

    // Display retrieved content with syntax highlighting
    displayRetrievedContent(data) {
        const container = document.getElementById('retrieved-section');
        const codeElement = document.getElementById('retrievedCode');
        const dataElement = document.getElementById('retrievedData');
        
        container.style.display = 'block';
        
        // Update metadata
        document.getElementById('contentSize').textContent = `${data.content.length} characters`;
        document.getElementById('contentType').textContent = data.contentType === 'code' ? 'Code' : 'Text';
        document.getElementById('contentViews').textContent = `${data.views || 0} views`;
        
        // Show language if available
        const languageElement = document.getElementById('contentLanguage');
        if (data.language && languageElement) {
            languageElement.textContent = data.language.toUpperCase();
            languageElement.style.display = 'inline';
        }
        
        // Apply syntax highlighting for code
        if (data.contentType === 'code' && data.language && typeof Prism !== 'undefined') {
            codeElement.className = `language-${data.language}`;
            codeElement.textContent = data.content;
            
            try {
                Prism.highlightElement(codeElement);
            } catch (error) {
                console.warn('Syntax highlighting failed:', error);
                codeElement.textContent = data.content;
            }
        } else {
            codeElement.className = '';
            codeElement.textContent = data.content;
        }
        
        // Join WebSocket room for real-time updates
        if (this.socket && this.pendingCode) {
            this.socket.emit('join-share', this.pendingCode);
            document.getElementById('realtimeIndicator').style.display = 'block';
        }
        
        this.showNotification('Content retrieved successfully!', 'success');
    }

    // Handle real-time updates
    handleRealtimeUpdate(data) {
        const codeElement = document.getElementById('retrievedCode');
        if (codeElement && document.getElementById('retrieved-section').style.display !== 'none') {
            codeElement.textContent = data.content;
            
            // Re-apply syntax highlighting if needed
            if (codeElement.className && typeof Prism !== 'undefined') {
                try {
                    Prism.highlightElement(codeElement);
                } catch (error) {
                    console.warn('Syntax highlighting failed:', error);
                }
            }
            
            this.showNotification('Content updated in real-time', 'info');
        }
    }

    // Copy to clipboard
    async copyToClipboard(elementId) {
        const element = document.getElementById(elementId);
        if (!element) return;
        
        try {
            await navigator.clipboard.writeText(element.textContent || element.value);
            this.showNotification('Copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            element.select();
            document.execCommand('copy');
            this.showNotification('Copied to clipboard!', 'success');
        }
    }

    // Copy retrieved content
    async copyRetrievedContent() {
        const codeElement = document.getElementById('retrievedCode');
        if (!codeElement) return;
        
        try {
            await navigator.clipboard.writeText(codeElement.textContent);
            this.showNotification('Content copied to clipboard!', 'success');
        } catch (error) {
            this.showNotification('Failed to copy content', 'error');
        }
    }    // Download content as file
    downloadContent() {
        const codeElement = document.getElementById('retrievedCode');
        const languageElement = document.getElementById('contentLanguage');
        
        if (!codeElement) return;
        
        const content = codeElement.textContent;
        
        // Check if content contains base64 file data (PDF or documents)
        const pdfMatch = content.match(/\[PDF File: (.+?)\][\s\S]*?File Data: (data:application\/pdf;base64,.+)/);
        const docMatch = content.match(/\[Document File: (.+?)\][\s\S]*?File Data: (data:application\/[^;]+;base64,.+)/);
        
        if (pdfMatch) {
            const [, filename, base64Data] = pdfMatch;
            this.downloadFromBase64(base64Data, filename, 'application/pdf');
            return;
        } else if (docMatch) {
            const [, filename, base64Data] = docMatch;
            const mimeType = base64Data.split(';')[0].split(':')[1];
            this.downloadFromBase64(base64Data, filename, mimeType);
            return;
        }
        
        // Download as regular text file
        const language = languageElement ? languageElement.textContent.toLowerCase() : 'txt';
        
        const extensionMap = {
            javascript: 'js',
            python: 'py',
            java: 'java',
            cpp: 'cpp',
            css: 'css',
            html: 'html',
            sql: 'sql',
            json: 'json',
            xml: 'xml'
        };
        
        const extension = extensionMap[language] || 'txt';
        const filename = `quicktext-${Date.now()}.${extension}`;
        
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification(`Downloaded as ${filename}`, 'success');
    }

    // Helper function to download file from base64 data
    downloadFromBase64(base64Data, filename, mimeType) {
        try {
            // Convert base64 to blob
            const byteCharacters = atob(base64Data.split(',')[1]);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const blob = new Blob([byteArray], { type: mimeType });

            // Create download link
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification(`File "${filename}" downloaded successfully!`, 'success');
        } catch (error) {
            console.error('Download error:', error);
            this.showNotification('Failed to download file. It may be corrupted.', 'error');
        }
    }

    // Clear content
    clearContent() {
        document.getElementById('shareData').value = '';
        document.getElementById('passwordInput').value = '';
        document.getElementById('maxViewsInput').value = '';
        document.getElementById('oneTimeAccess').checked = false;
        this.updateStats();
        this.showNotification('Content cleared', 'info');
    }

    // Paste from clipboard
    async pasteFromClipboard() {
        try {
            const text = await navigator.clipboard.readText();
            const textarea = document.getElementById('shareData');
            textarea.value = text;
            this.updateStats();
            this.showNotification('Content pasted from clipboard', 'success');
        } catch (error) {
            this.showNotification('Failed to paste from clipboard', 'error');
        }
    }

    // Auto-format content
    autoFormatContent() {
        const textarea = document.getElementById('shareData');
        let content = textarea.value;
        
        try {
            // Try to format as JSON
            const parsed = JSON.parse(content);
            content = JSON.stringify(parsed, null, 2);
            this.showNotification('Content formatted as JSON', 'success');
        } catch {
            // Not JSON, apply basic formatting
            content = content
                .replace(/\s+/g, ' ')  // Normalize whitespace
                .replace(/\s*([{}();,])\s*/g, '$1\n')  // Add newlines after punctuation
                .split('\n')
                .map(line => line.trim())
                .filter(line => line)
                .join('\n');
            this.showNotification('Basic formatting applied', 'success');
        }
        
        textarea.value = content;
        this.updateStats();    }

    // Show notification
    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas ${this.getNotificationIcon(type)}"></i>
            <span>${message}</span>
        `;
        
        // Add to page
        document.body.appendChild(notification);
        
        // Trigger animation
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after delay
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => document.body.removeChild(notification), 300);
        }, 3000);
    }

    // Get notification icon
    getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || icons.info;
    }    // Start background animations
    startBackgroundAnimations() {
        this.initCosmicBackground();
    }

    // Initialize cosmic space background
    initCosmicBackground() {
        // Create additional shooting stars dynamically
        const shootingStarsContainer = document.querySelector('.shooting-stars');
        if (shootingStarsContainer) {
            setInterval(() => {
                this.createShootingStar();
            }, 8000); // Create a new shooting star every 8 seconds
        }

        // Add interactive cosmic particles on mouse movement
        document.addEventListener('mousemove', (e) => {
            this.createCosmicParticle(e.clientX, e.clientY);
        });

        // Randomize nebula positions periodically
        setInterval(() => {
            this.randomizeNebulae();
        }, 30000); // Every 30 seconds
    }

    // Create dynamic shooting star
    createShootingStar() {
        const shootingStarsContainer = document.querySelector('.shooting-stars');
        if (!shootingStarsContainer) return;

        const star = document.createElement('div');
        star.className = 'shooting-star';
        
        // Random starting position
        const startX = Math.random() * window.innerWidth;
        const startY = Math.random() * (window.innerHeight * 0.5);
        
        star.style.left = startX + 'px';
        star.style.top = startY + 'px';
        star.style.animationDelay = '0s';
        
        shootingStarsContainer.appendChild(star);

        // Remove after animation completes
        setTimeout(() => {
            if (star.parentNode) {
                star.remove();
            }
        }, 3000);
    }

    // Create cosmic particle on mouse interaction
    createCosmicParticle(x, y) {
        const particle = document.createElement('div');
        particle.style.cssText = `
            position: fixed;
            left: ${x}px;
            top: ${y}px;
            width: 3px;
            height: 3px;
            background: radial-gradient(circle, rgba(255,255,255,0.8) 0%, transparent 70%);
            border-radius: 50%;
            pointer-events: none;
            z-index: 1;
            animation: cosmicParticleFloat 2s ease-out forwards;
        `;
        
        document.body.appendChild(particle);
        
        setTimeout(() => particle.remove(), 2000);
    }

    // Randomize nebula positions
    randomizeNebulae() {
        const nebulae = document.querySelectorAll('.nebula');
        nebulae.forEach((nebula, index) => {
            const randomX = Math.random() * 80; // 0-80%
            const randomY = Math.random() * 80; // 0-80%
            
            nebula.style.transition = 'all 10s ease-in-out';
            nebula.style.left = randomX + '%';
            nebula.style.top = randomY + '%';
        });
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for code in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    
    if (codeFromUrl && codeFromUrl.length === 4) {
        document.getElementById('codeInput').value = codeFromUrl.toUpperCase();
        // Auto-retrieve if code is provided
        setTimeout(() => {
            const app = new QuickTextPro();
            app.retrieveContent();
        }, 500);
    } else {
        new QuickTextPro();
    }
});
