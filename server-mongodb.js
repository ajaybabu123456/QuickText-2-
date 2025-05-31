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
                socketTimeoutMS: 45000,
                bufferCommands: false,
                bufferMaxEntries: 0
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

// Rate limiter
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting middleware
const rateLimitMiddleware = async (req, res, next) => {
    try {
        await rateLimiter.consume(req.ip);
        next();
    } catch (rejRes) {
        res.status(429).json({
            error: 'Too many requests',
            retryAfter: rejRes.msBeforeNext || 1000
        });
    }
};

// Apply rate limiting to API routes
app.use('/api', rateLimitMiddleware);

// Serve static files
app.use(express.static(path.join(__dirname, 'public')));

// Helper functions
const generateCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 4; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

const calculateExpiry = (duration) => {
    const now = new Date();
    switch (duration) {
        case '5m': return new Date(now.getTime() + 5 * 60 * 1000);
        case '15m': return new Date(now.getTime() + 15 * 60 * 1000);
        case '30m': return new Date(now.getTime() + 30 * 60 * 1000);
        case '1h': return new Date(now.getTime() + 60 * 60 * 1000);
        default: return new Date(now.getTime() + 15 * 60 * 1000);
    }
};

// API Routes

// Create a new share
app.post('/api/share', async (req, res) => {
    try {
        const { content, contentType = 'text', expiry = '15m', password, oneTimeAccess = false, maxViews } = req.body;
        
        if (!content || content.trim().length === 0) {
            return res.status(400).json({ error: 'Content is required' });
        }

        // Generate unique code
        let code;
        let isUnique = false;
        let attempts = 0;
        
        while (!isUnique && attempts < 10) {
            code = generateCode();
            const existingShare = await Share.findOne({ code });
            if (!existingShare) {
                isUnique = true;
            }
            attempts++;
        }

        if (!isUnique) {
            return res.status(500).json({ error: 'Unable to generate unique code' });
        }

        // Create share document
        const shareData = {
            code,
            content: content.trim(),
            contentType,
            expiresAt: calculateExpiry(expiry),
            oneTimeAccess,
            ipAddress: req.ip
        };

        if (password) {
            const bcrypt = require('bcrypt');
            shareData.password = await bcrypt.hash(password, 12);
        }

        if (maxViews && maxViews > 0) {
            shareData.maxViews = parseInt(maxViews);
        }

        const share = new Share(shareData);
        await share.save();

        console.log(`📝 Share created: ${code} (expires: ${shareData.expiresAt})`);

        res.json({
            code,
            expires: shareData.expiresAt,
            hasPassword: !!password,
            oneTimeAccess,
            maxViews: shareData.maxViews
        });

    } catch (error) {
        console.error('❌ Error creating share:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Retrieve a share
app.post('/api/retrieve/:code', async (req, res) => {
    try {
        const { code } = req.params;
        const { password } = req.body;

        if (!code || code.length !== 4) {
            return res.status(400).json({ error: 'Invalid code format' });
        }

        const share = await Share.findOne({ code: code.toUpperCase() });

        if (!share) {
            return res.status(404).json({ error: 'Share not found or expired' });
        }

        // Check if share has expired
        if (share.expiresAt < new Date()) {
            await Share.deleteOne({ _id: share._id });
            return res.status(404).json({ error: 'Share has expired' });
        }

        // Check if one-time access and already accessed
        if (share.oneTimeAccess && share.isAccessed) {
            return res.status(404).json({ error: 'Share has already been accessed' });
        }

        // Check max views
        if (share.maxViews > 0 && share.views >= share.maxViews) {
            return res.status(404).json({ error: 'Share has reached maximum views' });
        }

        // Check password
        if (share.password) {
            if (!password) {
                return res.status(401).json({ error: 'Password required', requiresPassword: true });
            }

            const bcrypt = require('bcrypt');
            const isValidPassword = await bcrypt.compare(password, share.password);
            if (!isValidPassword) {
                return res.status(401).json({ error: 'Invalid password' });
            }
        }

        // Increment view count and mark as accessed if one-time
        share.views++;
        if (share.oneTimeAccess) {
            share.isAccessed = true;
        }
        await share.save();

        console.log(`👁️ Share retrieved: ${code} (views: ${share.views})`);

        // Emit real-time update
        io.emit('share-accessed', {
            code,
            views: share.views,
            timestamp: new Date()
        });

        res.json({
            content: share.content,
            contentType: share.contentType,
            language: share.language,
            views: share.views,
            createdAt: share.createdAt,
            oneTimeAccess: share.oneTimeAccess,
            maxViews: share.maxViews
        });

        // Auto-delete if one-time access
        if (share.oneTimeAccess) {
            setTimeout(async () => {
                try {
                    await Share.deleteOne({ _id: share._id });
                    console.log(`🗑️ One-time share deleted: ${code}`);
                } catch (error) {
                    console.error('Error deleting one-time share:', error);
                }
            }, 1000);
        }

    } catch (error) {
        console.error('❌ Error retrieving share:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
    try {
        const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
        const shareCount = await Share.countDocuments();
        
        res.json({
            status: 'healthy',
            database: dbStatus,
            shares: shareCount,
            timestamp: new Date(),
            uptime: process.uptime()
        });
    } catch (error) {
        res.status(500).json({
            status: 'unhealthy',
            error: error.message
        });
    }
});

// Stats endpoint
app.get('/api/stats', async (req, res) => {
    try {
        const totalShares = await Share.countDocuments();
        const totalViews = await Share.aggregate([
            { $group: { _id: null, totalViews: { $sum: '$views' } } }
        ]);
        
        const recentShares = await Share.countDocuments({
            createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        res.json({
            totalShares,
            totalViews: totalViews[0]?.totalViews || 0,
            recentShares,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Error fetching stats:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Serve main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle direct share links
app.get('/:code', async (req, res) => {
    const { code } = req.params;
    
    if (code.length === 4) {
        try {
            const share = await Share.findOne({ code: code.toUpperCase() });
            if (share && share.expiresAt > new Date()) {
                // Serve the main page with the code in URL for auto-population
                res.sendFile(path.join(__dirname, 'public', 'index.html'));
                return;
            }
        } catch (error) {
            console.error('Error checking share:', error);
        }
    }
    
    res.status(404).sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Socket.IO for real-time features
io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);
    
    socket.on('join-share', (code) => {
        socket.join(`share-${code}`);
        console.log(`👥 User joined share room: ${code}`);
    });
    
    socket.on('disconnect', () => {
        console.log('👋 User disconnected:', socket.id);
    });
});

// Cleanup expired shares (runs every hour)
const cleanupExpiredShares = async () => {
    try {
        const result = await Share.deleteMany({
            expiresAt: { $lt: new Date() }
        });
        
        if (result.deletedCount > 0) {
            console.log(`🧹 Cleaned up ${result.deletedCount} expired shares`);
        }
    } catch (error) {
        console.error('Error cleaning up expired shares:', error);
    }
};

// Run cleanup every hour
setInterval(cleanupExpiredShares, 60 * 60 * 1000);

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n👋 Gracefully shutting down...');
    
    try {
        await mongoose.connection.close();
        console.log('📁 MongoDB connection closed');
    } catch (error) {
        console.error('Error closing MongoDB connection:', error);
    }
    
    server.close(() => {
        console.log('🛑 Server stopped');
        process.exit(0);
    });
});

// Start server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
    try {
        // Connect to MongoDB first
        await connectDB();
        
        // Then start the server
        server.listen(PORT, () => {
            console.log('🚀 QuickText Pro Server Started');
            console.log(`📡 Server running on port ${PORT}`);
            console.log(`🌐 Visit: http://localhost:${PORT}`);
            console.log(`💾 Database: MongoDB (${process.env.MONGODB_URI || 'mongodb://localhost:27017/quicktext-pro'})`);
            console.log('='.repeat(50));
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

startServer();
