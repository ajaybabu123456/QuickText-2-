# 🚀 QuickText Pro Deployment Guide

## Deployment Options

### 1. 🌊 Vercel Deployment (Recommended for Hobby/Personal)

**Prerequisites:**
- Vercel account
- MongoDB Atlas account

**Steps:**
1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy:
   ```bash
   vercel
   ```

4. Add environment variables in Vercel dashboard:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `NODE_ENV`: production
   - `JWT_SECRET`: Random secure string
   - `RATE_LIMIT_POINTS`: 50
   - `RATE_LIMIT_DURATION`: 60

**Vercel Config:** See `vercel.json`

---

### 2. 🚀 Railway Deployment (Recommended for Production)

**Prerequisites:**
- Railway account
- GitHub repository

**Steps:**
1. Connect GitHub repo to Railway
2. Set environment variables:
   - `MONGODB_URI`: Railway MongoDB or Atlas URI
   - `NODE_ENV`: production
   - `PORT`: 3000
   - `JWT_SECRET`: Random secure string

**Railway Config:** Automatic deployment from GitHub

---

### 3. 🐋 Docker Deployment

**Local Docker:**
```bash
# Build image
docker build -t quicktext-pro .

# Run container
docker run -p 3000:3000 -e MONGODB_URI="your-mongo-uri" quicktext-pro
```

**Docker Compose:**
```bash
# Run with MongoDB
docker-compose up -d
```

**Production Docker:**
- Use `docker-compose.prod.yml` for production
- Configure external MongoDB (Atlas recommended)

---

### 4. ☁️ AWS EC2/ECS Deployment

**EC2 Manual Setup:**
1. Launch Ubuntu EC2 instance
2. Install Node.js, MongoDB, PM2
3. Clone repository
4. Configure environment variables
5. Start with PM2: `pm2 start ecosystem.config.js`

**ECS Container:**
- Use provided Dockerfile
- Configure task definition
- Set up load balancer

---

### 5. 🌐 Heroku Deployment

**Prerequisites:**
- Heroku account
- Heroku CLI

**Steps:**
1. Login to Heroku:
   ```bash
   heroku login
   ```

2. Create app:
   ```bash
   heroku create your-app-name
   ```

3. Add MongoDB addon:
   ```bash
   heroku addons:create mongolab:sandbox
   ```

4. Deploy:
   ```bash
   git push heroku main
   ```

**Heroku Config:** See `Procfile`

---

### 6. 📱 Netlify (Static Frontend Only)

For frontend-only deployment with external API:
1. Build static version
2. Deploy to Netlify
3. Configure API endpoints

---

## 📋 Pre-Deployment Checklist

### ✅ Environment Setup
- [ ] MongoDB database ready (Atlas recommended)
- [ ] Environment variables configured
- [ ] Domain name ready (optional)
- [ ] SSL certificate (auto with most platforms)

### ✅ Code Preparation
- [ ] Update CORS origins for production
- [ ] Set appropriate rate limits
- [ ] Configure content size limits
- [ ] Test application locally

### ✅ Security
- [ ] Strong JWT secret
- [ ] Secure MongoDB connection
- [ ] Environment variables secured
- [ ] Rate limiting configured

### ✅ Monitoring
- [ ] Health check endpoint working
- [ ] Error logging configured
- [ ] Performance monitoring (optional)

---

## 🔧 Post-Deployment

### Test Deployment
```bash
# Test health endpoint
curl https://your-domain.com/health

# Test API
curl -X POST https://your-domain.com/api/share \
  -H "Content-Type: application/json" \
  -d '{"content":"test deployment"}'
```

### Monitor Performance
- Check `/health` endpoint regularly
- Monitor MongoDB connections
- Watch error logs
- Set up uptime monitoring

---

## 🆘 Troubleshooting

### Common Issues:
1. **MongoDB Connection**: Check MONGODB_URI format
2. **CORS Errors**: Update allowed origins
3. **Rate Limiting**: Adjust limits for production load
4. **Memory Issues**: Increase container/server memory
5. **Socket.IO**: Configure for production load balancer

### Debug Mode:
Set `NODE_ENV=development` to enable verbose logging.

---

## 📞 Support

For deployment issues:
1. Check application logs
2. Verify environment variables
3. Test MongoDB connection
4. Check platform-specific documentation

Choose the deployment option that best fits your needs and budget!
