const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { RateLimiterMemory } = require('rate-limiter-flexible');

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

// MongoDB Connection
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/quicktext-pro',
            {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000
            }
        );
        
        console.log(`🚀 MongoDB Connected: ${conn.connection.host}`);
        console.log(`📁 Database: ${conn.connection.name}`);
        
        // Handle connection events
        mongoose.connection.on('error', (error) => {
            console.error('❌ MongoDB connection error:', error);
        });

        mongoose.connection.on('disconnected', () => {
            console.log('⚠️ MongoDB disconnected');
        });

        mongoose.connection.on('reconnected', () => {
            console.log('🔄 MongoDB reconnected');
        });

    } catch (error) {
        console.error('❌ Error connecting to MongoDB:', error);
        process.exit(1);
    }
};

// MongoDB Share Schema
const shareSchema = new mongoose.Schema({
    code: { type: String, required: true, unique: true },
    content: { type: String, required: true },
    views: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true, expires: 0 },
    password: { type: String },
    oneTimeAccess: { type: Boolean, default: false },
    isAccessed: { type: Boolean, default: false },
    contentType: { type: String, enum: ['text', 'code'], default: 'text' },
    language: { type: String },
    ipAddress: { type: String },
    maxViews: { type: Number, default: -1 }
});

const Share = mongoose.model('Share', shareSchema);

// In-memory storage (use Redis in production)
const shares = new Map();
const rateLimiter = new RateLimiterMemory({
    keyPrefix: 'middleware',
    points: parseInt(process.env.RATE_LIMIT_POINTS) || 100,
    duration: parseInt(process.env.RATE_LIMIT_DURATION) || 60,
});

// Middleware
app.use(helmet({
    contentSecurityPolicy: false
}));
app.use(compression());
app.use(cors());
app.use(express.json({ limit: process.env.MAX_CONTENT_SIZE || '15mb' })); // Support for file uploads
app.use(express.static(path.join(__dirname, 'public')));

// Rate limiting middleware
app.use(async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res.status(429).json({ error: 'Too many requests' });
    }
});

// Generate random 4-character code
function generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

// Clean expired shares from MongoDB
async function cleanExpiredShares() {
    try {
        const result = await Share.deleteMany({ expiresAt: { $lt: new Date() } });
        if (result.deletedCount > 0) {
            console.log(`🧹 Cleaned ${result.deletedCount} expired shares`);
        }
    } catch (error) {
        console.error('❌ Error cleaning expired shares:', error);
    }
}

// Clean expired shares every minute
setInterval(cleanExpiredShares, parseInt(process.env.CLEANUP_INTERVAL) || 60000);

// Health check endpoint for deployment monitoring
app.get('/health', async (req, res) => {
    try {
        // Check MongoDB connection
        const dbState = mongoose.connection.readyState;
        const dbStatus = dbState === 1 ? 'connected' : dbState === 2 ? 'connecting' : 'disconnected';
        
        // Basic health information
        const healthInfo = {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            database: {
                status: dbStatus,
                connected: dbState === 1
            },
            memory: process.memoryUsage(),
            version: process.env.npm_package_version || '1.0.0'
        };

        // Return appropriate status code
        if (dbState === 1) {
            res.status(200).json(healthInfo);
        } else {
            res.status(503).json({ ...healthInfo, status: 'service unavailable' });
        }
    } catch (error) {
        res.status(500).json({ 
            status: 'error', 
            message: error.message,
            timestamp: new Date().toISOString()
        });
    }
});

// API Routes
app.post('/api/share', async (req, res) => {
    try {
        const { content, contentType = 'text', language, duration = '15m', maxViews, password, oneTimeAccess = false } = req.body;
        
        if (!content || content.length > 15000000) { // 15MB limit for file uploads
            return res.status(400).json({ error: 'Invalid content length' });
        }
        
        // Generate unique code
        let code;
        let attempts = 0;
        do {
            code = generateCode();
            attempts++;
            if (attempts > 10) {
                return res.status(500).json({ error: 'Unable to generate unique code' });
            }
        } while (await Share.findOne({ code }));
        
        // Calculate expiry
        const durationMs = {
            '5m': 5 * 60 * 1000,
            '15m': 15 * 60 * 1000,
            '30m': 30 * 60 * 1000,
            '1h': 60 * 60 * 1000
        };
        
        const expiresAt = new Date(Date.now() + (durationMs[duration] || durationMs['15m']));
        
        // Create and save share
        const share = new Share({
            code,
            content,
            contentType,
            language,
            password,
            maxViews: maxViews ? parseInt(maxViews) : -1,
            oneTimeAccess,
            expiresAt,
            ipAddress: req.ip
        });
        
        await share.save();
        
        res.json({
            code,
            duration,
            hasPassword: !!password,
            oneTimeAccess,
            expiresAt
        });
        
    } catch (error) {
        console.error('Error creating share:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

app.post('/api/retrieve/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { password } = req.body;
        
        const share = await Share.findOne({ code: code.toUpperCase() });
        
        if (!share) {
            return res.status(404).json({ error: 'Share not found or expired' });
        }
        
        // Check if expired (MongoDB should auto-delete, but double-check)
        if (share.expiresAt && new Date() > share.expiresAt) {
            await Share.deleteOne({ _id: share._id });
            return res.status(404).json({ error: 'Share expired' });
        }
        
        // Check password
        if (share.password && share.password !== password) {
            return res.status(401).json({ requiresPassword: true, error: 'Password required' });
        }
        
        // Check max views
        if (share.maxViews > 0 && share.views >= share.maxViews) {
            await Share.deleteOne({ _id: share._id });
            return res.status(404).json({ error: 'Maximum views reached' });
        }
        
        // Increment views
        share.views++;
        await share.save();
        
        // Delete if one-time access
        if (share.oneTimeAccess) {
            await Share.deleteOne({ _id: share._id });
        }
        
        res.json({
            content: share.content,
            contentType: share.contentType,
            language: share.language,
            views: share.views
        });
        
    } catch (error) {
        console.error('Error retrieving share:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Legacy endpoint for backward compatibility
app.post('/api/share/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { password } = req.body;
        
        const share = await Share.findOne({ code: code.toUpperCase() });
        
        if (!share) {
            return res.status(404).json({ error: 'Share not found or expired' });
        }
        
        // Check if expired (MongoDB should auto-delete, but double-check)
        if (share.expiresAt && new Date() > share.expiresAt) {
            await Share.deleteOne({ _id: share._id });
            return res.status(404).json({ error: 'Share expired' });
        }
        
        // Check password
        if (share.password && share.password !== password) {
            return res.status(401).json({ requiresPassword: true, error: 'Password required' });
        }
        
        // Check max views
        if (share.maxViews > 0 && share.views >= share.maxViews) {
            await Share.deleteOne({ _id: share._id });
            return res.status(404).json({ error: 'Maximum views reached' });
        }
        
        // Increment views
        share.views++;
        await share.save();
        
        // Delete if one-time access
        if (share.oneTimeAccess) {
            await Share.deleteOne({ _id: share._id });
        }
        
        res.json({
            content: share.content,
            contentType: share.contentType,
            language: share.language,
            views: share.views
        });
        
    } catch (error) {
        console.error('Error retrieving share:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// WebSocket handling
io.on('connection', (socket) => {
    socket.on('join-share', (code) => {
        socket.join(`share-${code}`);
    });
      socket.on('content-update', async (data) => {
        const { code, content } = data;
        try {
            const share = await Share.findOne({ code });
            
            if (share) {
                share.content = content;
                await share.save();
                socket.to(`share-${code}`).emit('content-updated', { code, content });
            }
        } catch (error) {
            console.error('Error updating content:', error);
        }
    });    
    socket.on('disconnect', () => {
        // Socket disconnected
    });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        // Check MongoDB connection
        const mongoStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        
        // Get basic statistics
        const totalShares = await Share.countDocuments();
        const activeShares = await Share.countDocuments({ expiresAt: { $gt: new Date() } });
        
        res.json({
            status: 'healthy',
            timestamp: new Date().toISOString(),
            database: {
                status: mongoStatus,
                totalShares,
                activeShares
            },
            server: {
                uptime: process.uptime(),
                memory: process.memoryUsage(),
                version: process.version
            }
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Statistics endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const stats = await Share.aggregate([
            {
                $group: {
                    _id: null,
                    totalShares: { $sum: 1 },
                    totalViews: { $sum: '$views' },
                    averageViews: { $avg: '$views' }
                }
            }
        ]);
        
        const contentTypeStats = await Share.aggregate([
            {
                $group: {
                    _id: '$contentType',
                    count: { $sum: 1 }
                }
            }
        ]);
        
        res.json({
            overview: stats[0] || { totalShares: 0, totalViews: 0, averageViews: 0 },
            contentTypes: contentTypeStats,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: 'Unable to fetch statistics' });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server with MongoDB connection
const startServer = async () => {
    try {
        // Connect to MongoDB
        await connectDB();
        
        // Start the server
        const PORT = process.env.PORT || 3000;
        server.listen(PORT, () => {
            console.log(`🚀 QuickText Pro server running on port ${PORT}`);
            console.log(`📱 Access at: http://localhost:${PORT}`);
            console.log(`💾 Database: MongoDB`);
            console.log(`🔄 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down gracefully...');
    
    try {
        // Close server
        server.close(() => {
            console.log('✅ HTTP server closed');
        });
        
        // Close MongoDB connection
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

process.on('SIGTERM', async () => {
    console.log('\n🛑 Received SIGTERM, shutting down gracefully...');
    
    try {
        server.close(() => {
            console.log('✅ HTTP server closed');
        });
        
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Error during shutdown:', error);
        process.exit(1);
    }
});

// Start the application
startServer();
