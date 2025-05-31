# 🍃 MongoDB Atlas Setup Guide for QuickText Pro

## Quick Setup (5 minutes)

### Step 1: Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for a free account
3. Verify your email address

### Step 2: Create a Cluster
1. Click **"Create"** → **"Cluster"**
2. Choose **M0 (Free Tier)** - Perfect for testing and small applications
3. Select your preferred **Cloud Provider** and **Region** (choose closest to your users)
4. Click **"Create Cluster"** (takes 3-5 minutes)

### Step 3: Configure Network Access
1. Go to **"Network Access"** in the left sidebar
2. Click **"Add IP Address"**
3. Choose **"Allow Access from Anywhere"** (0.0.0.0/0) for development
   - ⚠️ For production, add specific IP addresses of your deployment servers
4. Click **"Confirm"**

### Step 4: Create Database User
1. Go to **"Database Access"** in the left sidebar
2. Click **"Add New Database User"**
3. Choose **"Password"** authentication
4. Username: `quicktext-admin` (or your preferred username)
5. Password: Generate a strong password (save it securely!)
6. Database User Privileges: **"Read and write to any database"**
7. Click **"Add User"**

### Step 5: Get Connection String
1. Go to **"Database"** in the left sidebar
2. Click **"Connect"** on your cluster
3. Choose **"Connect your application"**
4. Driver: **Node.js**, Version: **4.1 or later**
5. Copy the connection string - it looks like:
   ```
   mongodb+srv://quicktext-admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
6. Replace `<password>` with your actual password
7. Add database name: `/quicktext-pro` after `.net`

### Final Connection String Format:
```
mongodb+srv://quicktext-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/quicktext-pro?retryWrites=true&w=majority
```

## Environment Variable Setup

Add this to your `.env.production` file:
```env
MONGODB_URI=mongodb+srv://quicktext-admin:YOUR_PASSWORD@cluster0.xxxxx.mongodb.net/quicktext-pro?retryWrites=true&w=majority
```

## Platform-Specific Setup

### Vercel
1. Go to your Vercel dashboard
2. Select your project → **Settings** → **Environment Variables**
3. Add: `MONGODB_URI` with your connection string

### Railway
1. Go to your Railway dashboard
2. Select your project → **Variables**
3. Add: `MONGODB_URI` with your connection string

### Heroku
```powershell
heroku config:set MONGODB_URI="your-connection-string-here"
```

### Docker
Add to your `.env.production` file:
```env
MONGODB_URI=your-connection-string-here
```

## Security Best Practices

### Production Network Security
1. **Never use 0.0.0.0/0 in production**
2. Add specific IP addresses of your deployment servers
3. Use VPC peering for cloud deployments when possible

### Connection String Security
1. **Never commit connection strings to git**
2. Use environment variables only
3. Rotate passwords regularly
4. Use database-specific users (not admin users)

### Database Security
1. Create separate users for different environments
2. Use read-only users where write access isn't needed
3. Enable MongoDB's built-in monitoring

## Testing Your Connection

Test locally with:
```powershell
# Set environment variable (Windows PowerShell)
$env:MONGODB_URI="your-connection-string-here"

# Run the MongoDB test
npm run test-mongodb
```

## Monitoring and Maintenance

### Atlas Monitoring
1. Use Atlas built-in monitoring dashboard
2. Set up alerts for:
   - High connection count
   - Storage usage (free tier: 512MB)
   - Slow queries

### Connection Limits
- **M0 (Free)**: 100 connections
- **M2**: 200 connections
- **M5**: 500 connections

QuickText Pro is configured with a connection pool of 10, which is perfect for most deployments.

## Troubleshooting

### Common Issues:

**"Authentication failed"**
- Check username/password in connection string
- Verify user has correct permissions

**"Connection timeout"**
- Check network access whitelist
- Verify cluster is running
- Check if your deployment platform IP is allowed

**"Database not found"**
- Ensure database name is in connection string
- MongoDB will create the database automatically when first document is inserted

**"Too many connections"**
- Monitor connection usage in Atlas
- Consider upgrading tier or optimizing connection pooling

### Test Connection Script:
```javascript
// test-atlas-connection.js
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB Atlas successfully!');
        
        // Test operations
        const testDoc = { test: 'deployment', timestamp: new Date() };
        const TestModel = mongoose.model('Test', new mongoose.Schema({}));
        await TestModel.create(testDoc);
        console.log('✅ Write operation successful!');
        
        const found = await TestModel.findOne(testDoc);
        console.log('✅ Read operation successful!');
        
        await TestModel.deleteOne(testDoc);
        console.log('✅ Delete operation successful!');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
}

testConnection();
```

## Support

- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [MongoDB Atlas Support](https://support.mongodb.com/)
- [Community Forums](https://developer.mongodb.com/community/forums/)

Your MongoDB Atlas database is now ready for QuickText Pro deployment! 🚀
