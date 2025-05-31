#!/usr/bin/env node

/**
 * MongoDB Integration Test Script
 * Tests the MongoDB-integrated QuickText Pro server
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Test MongoDB connection
async function testMongoConnection() {
    try {
        console.log('🔗 Testing MongoDB connection...');
          await mongoose.connect(
            process.env.MONGODB_URI || 'mongodb://localhost:27017/quicktext-pro',
            {
                maxPoolSize: 10,
                serverSelectionTimeoutMS: 5000,
                socketTimeoutMS: 45000
            }
        );
        
        console.log('✅ MongoDB connection successful!');
        console.log(`📁 Database: ${mongoose.connection.name}`);
        console.log(`🖥️  Host: ${mongoose.connection.host}`);
        
        // Test a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log(`📋 Collections: ${collections.map(c => c.name).join(', ') || 'None yet'}`);
        
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed successfully');
        
        return true;
    } catch (error) {
        console.error('❌ MongoDB connection failed:', error.message);
        return false;
    }
}

// Test API endpoints
async function testAPIEndpoints() {
    console.log('\n🌐 Testing API endpoints...');
    
    try {
        // Start server in background for testing
        const { spawn } = require('child_process');
        const serverProcess = spawn('node', ['server.js'], {
            cwd: process.cwd(),
            stdio: 'pipe'
        });
        
        // Wait for server to start
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        const fetch = require('node-fetch');
        const baseURL = 'http://localhost:3000';
        
        // Test health endpoint
        console.log('🏥 Testing health endpoint...');
        const healthResponse = await fetch(`${baseURL}/api/health`);
        if (healthResponse.ok) {
            const health = await healthResponse.json();
            console.log('✅ Health check passed:', health.status);
            console.log(`📊 Database status: ${health.database.status}`);
        } else {
            console.log('❌ Health check failed');
        }
        
        // Test creating a share
        console.log('📝 Testing share creation...');
        const shareResponse = await fetch(`${baseURL}/api/share`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: 'Test content for MongoDB integration',
                contentType: 'text',
                duration: '15m'
            })
        });
        
        if (shareResponse.ok) {
            const shareData = await shareResponse.json();
            console.log('✅ Share created successfully:', shareData.code);
            
            // Test retrieving the share
            console.log('📖 Testing share retrieval...');
            const retrieveResponse = await fetch(`${baseURL}/api/retrieve/${shareData.code}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            
            if (retrieveResponse.ok) {
                const retrieveData = await retrieveResponse.json();
                console.log('✅ Share retrieved successfully');
                console.log(`👀 Views: ${retrieveData.views}`);
            } else {
                console.log('❌ Share retrieval failed');
            }
        } else {
            console.log('❌ Share creation failed');
        }
        
        // Test stats endpoint
        console.log('📊 Testing statistics endpoint...');
        const statsResponse = await fetch(`${baseURL}/api/stats`);
        if (statsResponse.ok) {
            const stats = await statsResponse.json();
            console.log('✅ Statistics retrieved:', {
                totalShares: stats.overview.totalShares,
                totalViews: stats.overview.totalViews
            });
        } else {
            console.log('❌ Statistics retrieval failed');
        }
        
        // Clean up
        serverProcess.kill();
        console.log('✅ Test server stopped');
        
    } catch (error) {
        console.error('❌ API testing failed:', error.message);
    }
}

// Main test function
async function runTests() {
    console.log('🧪 Starting MongoDB Integration Tests\n');
    console.log('=' .repeat(50));
    
    const mongoOk = await testMongoConnection();
    
    if (mongoOk) {
        await testAPIEndpoints();
    } else {
        console.log('\n⚠️ Skipping API tests due to MongoDB connection failure');
        console.log('\n💡 Make sure MongoDB is running:');
        console.log('   - Install MongoDB: https://www.mongodb.com/try/download/community');
        console.log('   - Start MongoDB service');
        console.log('   - Or update MONGODB_URI in .env to use MongoDB Atlas');
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('🎯 MongoDB Integration Test Complete');
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests().then(() => {
        process.exit(0);
    }).catch(error => {
        console.error('❌ Test suite failed:', error);
        process.exit(1);
    });
}

module.exports = { testMongoConnection, testAPIEndpoints };
