#!/usr/bin/env node

/**
 * MongoDB Setup Script for QuickText Pro
 * Ensures MongoDB is properly configured and ready for use
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function setupMongoDB() {
    console.log('🚀 Setting up MongoDB for QuickText Pro...\n');
    
    try {
        // Connect to MongoDB
        console.log('🔗 Connecting to MongoDB...');        const conn = await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/quicktext-pro',
            {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000
            }
        );
        
        console.log(`✅ Connected to MongoDB: ${conn.connection.host}`);
        console.log(`📁 Database: ${conn.connection.name}`);
        
        // Create Share schema and model
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
        
        // Create indexes for better performance
        console.log('📊 Creating database indexes...');
        await Share.createIndexes();
        console.log('✅ Indexes created successfully');
        
        // Clean up any existing expired shares
        console.log('🧹 Cleaning up expired shares...');
        const deleteResult = await Share.deleteMany({ expiresAt: { $lt: new Date() } });
        console.log(`🗑️  Removed ${deleteResult.deletedCount} expired shares`);
        
        // Show current statistics
        const totalShares = await Share.countDocuments();
        const activeShares = await Share.countDocuments({ expiresAt: { $gt: new Date() } });
        
        console.log('\n📈 Current Database Statistics:');
        console.log(`   Total shares: ${totalShares}`);
        console.log(`   Active shares: ${activeShares}`);
        console.log(`   Expired shares cleaned: ${deleteResult.deletedCount}`);
        
        // Test creating a sample share
        console.log('\n🧪 Testing share creation...');
        const testShare = new Share({
            code: 'TEST',
            content: 'MongoDB integration test - you can delete this',
            contentType: 'text',
            expiresAt: new Date(Date.now() + 5 * 60 * 1000) // 5 minutes
        });
        
        try {
            await testShare.save();
            console.log('✅ Test share created successfully');
            
            // Clean up test share
            await Share.deleteOne({ code: 'TEST' });
            console.log('🗑️  Test share cleaned up');
        } catch (error) {
            if (error.code === 11000) {
                console.log('ℹ️  Test share already exists (duplicate key), skipping...');
            } else {
                throw error;
            }
        }
        
        await mongoose.connection.close();
        console.log('\n✅ MongoDB setup completed successfully!');
        console.log('\n🎯 Your QuickText Pro database is ready to use');
        
    } catch (error) {
        console.error('\n❌ MongoDB setup failed:', error.message);
        
        if (error.message.includes('ECONNREFUSED')) {
            console.log('\n💡 MongoDB Connection Tips:');
            console.log('   1. Make sure MongoDB is installed and running');
            console.log('   2. Check if MongoDB service is started');
            console.log('   3. Verify the connection string in .env file');
            console.log('\n📖 MongoDB Installation Guide:');
            console.log('   Windows: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/');
            console.log('   macOS: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-os-x/');
            console.log('   Linux: https://docs.mongodb.com/manual/administration/install-on-linux/');
            console.log('\n☁️  Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
        }
        
        process.exit(1);
    }
}

// Run setup if this file is executed directly
if (require.main === module) {
    setupMongoDB();
}

module.exports = { setupMongoDB };
