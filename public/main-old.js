document.addEventListener('DOMContentLoaded', () => {
    // Elements
    const shareData = document.getElementById('shareData');
    const shareButton = document.getElementById('shareButton');
    // const generatedCodeDisplay = document.getElementById('generatedCode'); // No longer primary display
    const generatedCodeContainer = document.querySelector('.generated-code-container');
    const generatedLinkDisplay = document.getElementById('generatedLinkDisplay');
    const copyShareLinkButton = document.getElementById('copyShareLinkButton');
    const generatedCodeHidden = document.getElementById('generatedCodeHidden');

    const codeInput = document.getElementById('codeInput');
    const retrieveButton = document.getElementById('retrieveButton');
    // const retrievedData = document.getElementById('retrievedData'); // Old textarea, replaced by pre/code
    const retrievedDataPre = document.getElementById('retrievedDataPre');
    const retrievedDataCode = document.getElementById('retrievedDataCode');
    const viewCount = document.getElementById('viewCount');
    const copyRetrievedButton = document.getElementById('copyRetrievedButton');

    const clearEditorButton = document.getElementById('clearEditorButton');
    const copyEditorContentButton = document.getElementById('copyEditorContentButton');
    const charCount = document.getElementById('charCount');
    const themeToggleButton = document.getElementById('themeToggleButton');
    const toastContainer = document.getElementById('toastContainer');
    const loader = document.getElementById('loader');

    let lastSharedCode = null;
    let debounceTimer;

    // Utility to show/hide loader
    const showLoader = () => { if (loader) loader.style.display = 'flex'; };
    const hideLoader = () => { if (loader) loader.style.display = 'none'; };

    // Toast notification function
    const showToast = (message, type = 'success') => {
        if (!toastContainer) return;
        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        toastContainer.appendChild(toast);
        setTimeout(() => {
            toast.classList.add('show');
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    if (toast.parentNode === toastContainer) {
                         toastContainer.removeChild(toast);
                    }
                }, 300);
            }, 3000);
        }, 10);
    };
    
    // Update character count
    const updateCharCount = () => {
        if (!shareData || !charCount) return;
        const count = shareData.value.length;
        charCount.textContent = `${count}`; // Simpler count display
    };

    // Initial char count
    updateCharCount();

    shareData.addEventListener('input', () => {
        updateCharCount();
        const currentText = shareData.value;

        if (lastSharedCode && codeInput && codeInput.value === lastSharedCode) {
            if (retrievedDataCode) {
                retrievedDataCode.textContent = currentText;
                Prism.highlightElement(retrievedDataCode);
            }

            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(async () => {
                if (lastSharedCode) {
                    try {
                        const response = await fetch(`/api/share/${lastSharedCode}`, {
                            method: 'PUT',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ data: currentText })
                        });
                        if (!response.ok) {
                            console.error('Failed to update share in real-time. Status: ' + response.status);
                            // Optionally show a non-intrusive error to the user
                        } else {
                            // const result = await response.json(); // Get updated data if needed (e.g. views, though PUT doesn't update views here)
                            // if (viewCount && result.views !== undefined) viewCount.textContent = result.views;
                        }
                    } catch (error) {
                        console.error('Real-time update network error:', error);
                    }
                }
            }, 750);
        }
    });

    if (copyEditorContentButton) {
        copyEditorContentButton.addEventListener('click', () => {
            if (!shareData.value) {
                showToast('Nothing to copy from editor.', 'warning');
                return;
            }
            navigator.clipboard.writeText(shareData.value)
                .then(() => showToast('Editor content copied to clipboard!'))
                .catch(err => {
                    showToast('Failed to copy editor content.', 'error');
                    console.error('Failed to copy editor content: ', err);
                });
        });
    }

    if (clearEditorButton) {
        clearEditorButton.addEventListener('click', () => {
            shareData.value = '';
            updateCharCount();
            showToast('Editor cleared.', 'info');
        });
    }

    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', (e) => {
            e.preventDefault();
            document.body.classList.toggle('dark-theme');
            const icon = themeToggleButton.querySelector('i');
            if (icon) {
                icon.classList.toggle('fa-moon');
                icon.classList.toggle('fa-sun');
            }
            localStorage.setItem('theme', document.body.classList.contains('dark-theme') ? 'dark' : 'light');
        });
    }
    // Load saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark' && !document.body.classList.contains('dark-theme')) {
        document.body.classList.add('dark-theme');
        const icon = themeToggleButton ? themeToggleButton.querySelector('i') : null;
        if (icon) {
            icon.classList.remove('fa-sun');
            icon.classList.add('fa-moon');
        }
    } else if (savedTheme === 'light' && document.body.classList.contains('dark-theme')) {
         document.body.classList.remove('dark-theme');
         const icon = themeToggleButton ? themeToggleButton.querySelector('i') : null;
        if (icon) {
            icon.classList.remove('fa-moon');
            icon.classList.add('fa-sun');
        }
    }


    if (shareButton) {
        shareButton.addEventListener('click', async () => {
            const data = shareData.value;
            if (!data) {
                showToast('Cannot share empty content.', 'error');
                return;
            }
            showLoader();
            try {
                const response = await fetch('/api/share', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data }),
                });

                if (response.ok) {
                    const result = await response.json();
                    const shareUrl = `${window.location.origin}${window.location.pathname}#${result.code}`;

                    if (generatedLinkDisplay) {
                        generatedLinkDisplay.href = shareUrl;
                        generatedLinkDisplay.textContent = shareUrl;
                    }
                    if (generatedCodeHidden) generatedCodeHidden.value = result.code;
                    if (generatedCodeContainer) generatedCodeContainer.style.display = 'flex';

                    lastSharedCode = result.code;
                    showToast('Code shared successfully! Link copied to clipboard.');
                    navigator.clipboard.writeText(shareUrl).catch(err => console.error('Failed to copy link: ', err));

                    if (codeInput) codeInput.value = result.code;
                    if (retrievedDataCode) {
                        retrievedDataCode.textContent = data;
                        Prism.highlightElement(retrievedDataCode);
                    }
                    if (viewCount) viewCount.textContent = '0';
                } else {
                    const errorResult = await response.json().catch(() => ({ message: 'Failed to share code and parse error.' }));
                    showToast(`Error: ${errorResult.message || 'Failed to share code.'}`, 'error');
                }
            } catch (error) {
                showToast('Network error. Please try again.', 'error');
                console.error('Share error:', error);
            } finally {
                hideLoader();
            }
        });
    }

    if (retrieveButton) {
        retrieveButton.addEventListener('click', async () => {
            const code = codeInput.value;
            if (!code) {
                showToast('Please enter a share code.', 'error');
                return;
            }
            showLoader();
            try {
                const response = await fetch(`/api/share/${code}`);

                if (response.ok) {
                    const result = await response.json();
                    if (retrievedDataCode) {
                        retrievedDataCode.textContent = result.data;
                        Prism.highlightElement(retrievedDataCode);
                    }
                    if (viewCount) viewCount.textContent = result.views;
                    lastSharedCode = code;
                    showToast('Content retrieved successfully.');
                } else {
                    if (retrievedDataCode) {
                        retrievedDataCode.textContent = 'Failed to retrieve content. Invalid code or expired link.';
                        Prism.highlightElement(retrievedDataCode);
                    }
                    if (viewCount) viewCount.textContent = '0';
                    showToast('Failed to retrieve content. Invalid code or expired link.', 'error');
                }
            } catch (error) {
                if (retrievedDataCode) {
                    retrievedDataCode.textContent = 'Network error. Please try again.';
                    Prism.highlightElement(retrievedDataCode);
                }
                if (viewCount) viewCount.textContent = '0';
                showToast('Network error. Please try again.', 'error');
                console.error('Retrieve error:', error);
            } finally {
                hideLoader();
            }
        });
    }

    if (copyShareLinkButton) {
        copyShareLinkButton.addEventListener('click', () => {
            const link = generatedLinkDisplay ? generatedLinkDisplay.href : null;
            if (link && generatedLinkDisplay.textContent && !generatedLinkDisplay.textContent.startsWith('http://localhost:NaN')) { // Check if it's a valid generated link
                navigator.clipboard.writeText(link)
                    .then(() => showToast('Share link copied to clipboard!'))
                    .catch(err => {
                        showToast('Failed to copy link.', 'error');
                        console.error('Failed to copy link: ', err);
                    });
            } else {
                showToast('No valid share link to copy.', 'warning');
            }
        });
    }

    if (copyRetrievedButton) {
        copyRetrievedButton.addEventListener('click', () => {
            const content = retrievedDataCode ? retrievedDataCode.textContent : '';
            const defaultMessages = [
                'Enter a code and click retrieve, or load a share link.',
                'Failed to retrieve content. Invalid code or expired link.',
                'Network error. Please try again.',
                'Enter a code and click retrieve.', // from original HTML
                '' 
            ];
            if (content && !defaultMessages.includes(content)) {
                navigator.clipboard.writeText(content)
                    .then(() => showToast('Retrieved content copied to clipboard!'))
                    .catch(err => {
                        showToast('Failed to copy content.', 'error');
                        console.error('Failed to copy content: ', err);
                    });
            } else {
                showToast('No content to copy.', 'warning');
            }
        });
    }
    
    const loadContentFromHash = async () => {
        if (window.location.hash) {
            const codeFromHash = window.location.hash.substring(1);
            if (codeFromHash && codeInput && retrieveButton) {
                codeInput.value = codeFromHash;
                
                showLoader();
                try {
                    const response = await fetch(`/api/share/${codeFromHash}`);
                    if (response.ok) {
                        const result = await response.json();
                        if (retrievedDataCode) {
                            retrievedDataCode.textContent = result.data;
                            Prism.highlightElement(retrievedDataCode);
                        }
                        if (viewCount) viewCount.textContent = result.views;
                        lastSharedCode = codeFromHash;
                        showToast('Content loaded from link.');
                    } else {
                        if (retrievedDataCode) {
                            retrievedDataCode.textContent = 'Failed to load content from link. Invalid code or expired link.';
                            Prism.highlightElement(retrievedDataCode);
                        }
                        if (viewCount) viewCount.textContent = '0';
                        showToast('Failed to load content from link.', 'error');
                    }
                } catch (error) {
                     if (retrievedDataCode) {
                        retrievedDataCode.textContent = 'Network error while loading from link.';
                        Prism.highlightElement(retrievedDataCode);
                    }
                    if (viewCount) viewCount.textContent = '0';
                    showToast('Network error while loading from link.', 'error');
                    console.error('Hash load error:', error);
                } finally {
                    hideLoader();
                }
                // history.pushState("", document.title, window.location.pathname + window.location.search);
            }
        }
    };

    // Initial load from hash
    loadContentFromHash();

    // Listen for hash changes
    window.addEventListener('hashchange', loadContentFromHash);

    // Initialize Prism for the initial placeholder text in retrievedDataCode
    if (retrievedDataCode && retrievedDataCode.textContent) {
        Prism.highlightElement(retrievedDataCode);
    }
});
