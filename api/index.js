// Serverless function for Vercel

// In-memory storage for serverless
let memoryShares = new Map();
let activeConnections = new Map(); // Track active connections for real-time updates

// Add some test data for immediate testing
memoryShares.set('TEST', {
    code: 'TEST',
    content: 'This is a test share for debugging the serverless API',
    contentType: 'text',
    language: '',
    password: '',
    maxViews: 0,
    currentViews: 0,
    oneTimeAccess: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    fileName: '',
    isFile: false,
    createdAt: new Date()
});

memoryShares.set('DB5M', {
    code: 'DB5M',
    content: 'Sample content for code DB5M - testing the exact issue reported',
    contentType: 'text',
    language: '',
    password: '',
    maxViews: 0,
    currentViews: 0,
    oneTimeAccess: false,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    fileName: '',
    isFile: false,
    createdAt: new Date()
});

console.log('Test shares initialized:', Array.from(memoryShares.keys()));

// Rate limiting helper
let requestCounts = new Map();

const isRateLimited = (ip) => {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = 20;
    
    if (!requestCounts.has(ip)) {
        requestCounts.set(ip, []);
    }
    
    const requests = requestCounts.get(ip);
    // Remove old requests outside the window
    const recentRequests = requests.filter(time => now - time < windowMs);
    
    // Clean up empty IP entries to prevent memory leak
    if (recentRequests.length === 0) {
        requestCounts.delete(ip);
        return false;
    }
    
    // Update with filtered requests
    requestCounts.set(ip, recentRequests);
    
    if (recentRequests.length >= maxRequests) {
        return true;
    }
      recentRequests.push(now);
    requestCounts.set(ip, recentRequests);
    return false;
};

// Periodic cleanup of old rate limiting data
setInterval(() => {
    const now = Date.now();
    const windowMs = 60 * 1000;
    
    for (const [ip, requests] of requestCounts.entries()) {
        const recentRequests = requests.filter(time => now - time < windowMs);
        if (recentRequests.length === 0) {
            requestCounts.delete(ip);
        } else {
            requestCounts.set(ip, recentRequests);
        }
    }
}, 5 * 60 * 1000); // Cleanup every 5 minutes

// Utility functions
const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const getExpiryString = (duration) => {
    const map = {
        '5m': '5 minutes',
        '15m': '15 minutes',
        '30m': '30 minutes',
        '1h': '1 hour'
    };
    return map[duration] || '15 minutes';
};

const parseExpiry = (expiry) => {
    const now = new Date();
    switch (expiry) {
        case '5m': return new Date(now.getTime() + 5 * 60 * 1000);
        case '15m': return new Date(now.getTime() + 15 * 60 * 1000);
        case '30m': return new Date(now.getTime() + 30 * 60 * 1000);
        case '1h': return new Date(now.getTime() + 60 * 60 * 1000);
        default: return new Date(now.getTime() + 15 * 60 * 1000);
    }
};

// Format SSE message
function formatSSE(data) {
    try {
        const jsonString = JSON.stringify(data);
        return `data: ${jsonString}\n\n`;
    } catch (error) {
        console.error('SSE format error:', error);
        return `data: ${JSON.stringify({ error: 'Message format error' })}\n\n`;
    }
}

// Send SSE message to all active connections
function broadcastUpdate(code, data) {
    if (activeConnections.has(code)) {
        const connections = activeConnections.get(code);
        const message = formatSSE(data);
        
        connections.forEach(conn => {
            try {
                conn.write(message);
            } catch (err) {
                console.error('Error sending update:', err);
                // Remove failed connection
                connections.delete(conn);
            }
        });
        
        // Cleanup if no connections remain
        if (connections.size === 0) {
            activeConnections.delete(code);
        }
    }
}

// Main serverless handler
module.exports = async (req, res) => {
    // Wrap everything in try/catch to ensure proper JSON responses
    try {
        // Set CORS and content type headers
        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Accept');
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');

        // Handle preflight requests
        if (req.method === 'OPTIONS') {
            return res.status(200).json({ status: 'ok' });
        }

        // Rate limiting
        const clientIP = req.headers['x-forwarded-for'] || 
                      (req.connection && req.connection.remoteAddress) || 
                      req.socket?.remoteAddress || 
                      'unknown';
                   
        if (isRateLimited(clientIP)) {
            return res.status(429).json({ error: 'Too many requests' });
        }
    
        const { url, method } = req;
        console.log('API Request received:', { url, method, timestamp: new Date().toISOString() });

        // Route handling
        if (url === '/api/share' && method === 'POST') {
            console.log('Routing to: handleCreateShare');
            return await handleCreateShare(req, res);
        } else if (url.startsWith('/api/share/') && method === 'GET') {
            console.log('Routing to: handleGetShare');
            const codePath = url.split('?')[0];
            const code = codePath.split('/').filter(part => part).pop();
            console.log('Extracted code from URL:', { url, codePath, code });
            
            if (!code || code.length !== 4) {
                console.log('Invalid code format:', code);
                return res.status(400).json({ error: 'Invalid code format' });
            }
            
            return await handleGetShare(req, res, code.toUpperCase());
        } else if (url.startsWith('/api/share/') && method === 'PUT') {
            console.log('Routing to: handleUpdateShare');
            const codePath = url.split('?')[0];
            const code = codePath.split('/').filter(part => part).pop();
            console.log('Extracted code from URL:', { url, codePath, code });
            
            if (!code || code.length !== 4) {
                console.log('Invalid code format:', code);
                return res.status(400).json({ error: 'Invalid code format' });
            }
            
            return await handleUpdateShare(req, res, code.toUpperCase());
        } else if (url === '/health' || url === '/api/health') {
            console.log('Routing to: handleHealth');
            return await handleHealth(req, res);
        } else {
            console.log('Route not found for:', { url, method });
            return res.status(404).json({ error: 'Route not found', url: url });
        }
    } catch (error) {
        console.error('Global error handler:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
};

// Handle share creation
async function handleCreateShare(req, res) {
    try {
        const body = await parseBody(req);
        const { content, contentType, language, password, maxViews, oneTimeAccess, duration, fileName, isFile } = body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Generate unique code
        let code;
        let attempts = 0;
        do {
            code = generateCode();
            attempts++;
        } while (attempts < 100 && memoryShares.has(code));
        
        if (attempts >= 100) {
            return res.status(500).json({ error: 'Unable to generate unique code' });
        }
        
        const shareData = {
            code,
            content,
            contentType: contentType || 'text',
            language: language || '',
            password: password || '',
            maxViews: parseInt(maxViews) || 0,
            currentViews: 0,
            oneTimeAccess: Boolean(oneTimeAccess),
            expiresAt: parseExpiry(duration || '15m'),
            fileName: fileName || '',
            isFile: Boolean(isFile),
            createdAt: new Date()
        };

        // Debug logging for password
        console.log(`Creating share ${code}:`, {
            hasPassword: !!shareData.password,
            passwordLength: shareData.password ? shareData.password.length : 0,
            password: shareData.password // Remove this in production!
        });

        // Store in memory
        memoryShares.set(code, shareData);

        // Log concise info
        const contentLength = content.length;
        console.log(`Created share ${code}: ${contentType}, ${contentLength} bytes`);

        return res.json({
            success: true,
            code,
            expiresAt: shareData.expiresAt
        });

    } catch (error) {
        console.error('Share creation error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
}

// Handle share retrieval
async function handleGetShare(req, res, code) {
    try {
        console.log('Retrieving share:', code);
        
        const share = memoryShares.get(code);
        if (!share) {
            console.log('Share not found:', code);
            return res.status(404).json({ error: 'Share not found or expired' });
        }

        // Check expiry
        if (share.expiresAt < new Date()) {
            console.log('Share expired:', code);
            memoryShares.delete(code);
            return res.status(404).json({ error: 'Share expired' });
        }
        
        // Check password protection
        if (share.password && share.password.length > 0) {
            // Parse query parameters from the URL
            const url = new URL(req.url, `http://${req.headers.host}`);
            const providedPassword = url.searchParams.get('password');
            
            console.log('Password validation for share:', code, {
                storedPassword: share.password,
                providedPassword: providedPassword,
                passwordsMatch: providedPassword === share.password
            });
            
            if (!providedPassword || providedPassword !== share.password) {
                console.log('Password mismatch for share:', code);
                return res.status(401).json({ error: 'Invalid password' });
            }
        } else {
            console.log('Share has no password protection:', code, {
                password: share.password, 
                length: share.password ? share.password.length : 0 
            });
        }
        
        // Check if max views reached
        if (share.maxViews > 0 && share.currentViews >= share.maxViews) {
            console.log('Share max views reached:', code);
            memoryShares.delete(code);
            return res.status(404).json({ error: 'Share has reached maximum allowed views' });
        }
        
        // Store current view count BEFORE incrementing
        const currentViews = share.currentViews || 0;

        // Prepare response with current view count (before this access)
        const response = {
            code,
            content: share.content,
            contentType: share.contentType || 'text',
            language: share.language || '',
            views: currentViews,  // Shows count BEFORE this access
            maxViews: share.maxViews || -1,
            expiry: getExpiryString(share.duration),
            expiresAt: share.expiresAt
        };

        // NOW increment the view count AFTER preparing response
        share.currentViews = currentViews + 1;

        // Handle one-time access or max views reached after incrementing
        if (share.oneTimeAccess || (share.maxViews > 0 && share.currentViews >= share.maxViews)) {
            console.log(`Deleting share ${code} after access (oneTime: ${share.oneTimeAccess}, views: ${share.currentViews}/${share.maxViews})`);
            memoryShares.delete(code);
        } else {
            // Update share in memory
            memoryShares.set(code, share);
        }

        // Log concise info, excluding content
        const contentLength = share.content.length;
        console.log(`Share ${code}: ${share.contentType}, ${contentLength} bytes, ${share.currentViews} views`);

        return res.status(200).json(response);
    } catch (error) {
        console.error('Share retrieval error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            message: error.message
        });
    }
}

// Handle share update
async function handleUpdateShare(req, res, code) {
    try {
        console.log('Updating share:', code);
        
        const share = memoryShares.get(code);
        if (!share) {
            return res.status(404).json({ error: 'Share not found' });
        }
        
        if (new Date() > new Date(share.expiresAt)) {
            memoryShares.delete(code);
            return res.status(404).json({ error: 'Share has expired' });
        }
        
        // Parse request body
        const updateData = req.body;
        if (!updateData || !updateData.content) {
            return res.status(400).json({ error: 'Content is required' });
        }
        
        // Update share data
        share.content = updateData.content;
        if (updateData.contentType) {
            share.contentType = updateData.contentType;
        }
        
        // Store updated share
        memoryShares.set(code, share);
        
        // Broadcast update to all connected clients
        broadcastUpdate(code, {
            type: 'update',
            content: share.content,
            contentType: share.contentType,
            timestamp: new Date().toISOString()
        });
        
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json({
            success: true,
            message: 'Content updated successfully'
        });
    } catch (error) {
        console.error('Update error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}

// SSE connection handler
async function handleSSEConnection(req, res, code) {
    try {
        const share = memoryShares.get(code);
        if (!share) {
            return res.status(404).json({ error: 'Share not found' });
        }
        
        // Set headers for SSE
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        
        // Add this connection to active connections
        if (!activeConnections.has(code)) {
            activeConnections.set(code, new Set());
        }
        const connections = activeConnections.get(code);
        connections.add(res);
        
        // Send initial data
        const initialMessage = formatSSE({
            type: 'connected',
            content: share.content,
            contentType: share.contentType,
            timestamp: new Date().toISOString()
        });
        res.write(initialMessage);
          // Setup connection cleanup
        req.on('close', () => {
            clearInterval(keepAliveInterval);  // Clear interval on close
            connections.delete(res);
            if (connections.size === 0) {
                activeConnections.delete(code);
            }
            console.log(`Client disconnected from ${code}. Active connections: ${connections.size}`);
        });
        
        req.on('error', (error) => {
            console.error('SSE connection error:', error);
            clearInterval(keepAliveInterval);  // Clear interval on error
            connections.delete(res);
            if (connections.size === 0) {
                activeConnections.delete(code);
            }
        });
        
        // Keep connection alive
        const keepAliveInterval = setInterval(() => {
            try {
                res.write(formatSSE({ type: 'ping', timestamp: new Date().toISOString() }));
            } catch (error) {
                console.error('SSE ping error:', error);
                clearInterval(keepAliveInterval);
                connections.delete(res);
                if (connections.size === 0) {
                    activeConnections.delete(code);
                }
            }
        }, 30000); // Send ping every 30 seconds
        
    } catch (error) {
        console.error('SSE connection error:', error);
        return res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
}

// Handle health check
async function handleHealth(req, res) {
    try {
        const response = {
            status: 'healthy',
            timestamp: new Date().toISOString(),
            server: {
                uptime: process.uptime(),
                memoryUsage: process.memoryUsage()
            },
            shares: {
                active: memoryShares.size,
                recentAccesses: Array.from(memoryShares.values()).filter(s => 
                    new Date(s.lastAccessed) > new Date(Date.now() - 15 * 60 * 1000)
                ).length
            }
        };
        res.setHeader('Content-Type', 'application/json');
        return res.status(200).json(response);
    } catch (error) {
        console.error('Health check error:', error);
        return res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
}

// Parse request body
function parseBody(req) {
    return new Promise((resolve, reject) => {
        if (req.body) {
            return resolve(req.body);
        }

        let data = '';
        req.on('data', chunk => {
            data += chunk;
        });
        req.on('end', () => {
            try {
                resolve(data ? JSON.parse(data) : {});
            } catch (error) {
                reject(error);
            }
        });
        req.on('error', reject);
    });
}
