# QuickText Pro - Advanced Text & Code Sharing Platform

[![GitHub stars](https://img.shields.io/github/stars/YOUR_GITHUB_USERNAME/quicktext-pro?style=social)](https://github.com/YOUR_GITHUB_USERNAME/quicktext-pro/stargazers)
[![GitHub forks](https://img.shields.io/github/forks/YOUR_GITHUB_USERNAME/quicktext-pro?style=social)](https://github.com/YOUR_GITHUB_USERNAME/quicktext-pro/network/members)
[![GitHub issues](https://img.shields.io/github/issues/YOUR_GITHUB_USERNAME/quicktext-pro)](https://github.com/YOUR_GITHUB_USERNAME/quicktext-pro/issues)
[![GitHub license](https://img.shields.io/github/license/YOUR_GITHUB_USERNAME/quicktext-pro)](https://github.com/YOUR_GITHUB_USERNAME/quicktext-pro/blob/main/LICENSE)

> 🚀 **QuickText Pro** - A modern, secure, and feature-rich text & code sharing platform with real-time collaboration

## 🚀 Features

QuickText Pro is a modern, feature-rich text and code sharing platform with enterprise-level capabilities while maintaining the simplicity of 4-character share codes.

### ✨ Core Features
- **Instant Sharing**: Generate 4-character codes for immediate text/code sharing
- **Real-time Updates**: WebSocket-powered live sharing and notifications
- **Syntax Highlighting**: Automatic language detection and beautiful code highlighting
- **QR Code Generation**: Instant QR codes for easy mobile sharing
- **Modern UI**: Glass morphism design with smooth animations

### 🔒 Security Features
- **Password Protection**: Encrypt shares with bcrypt-hashed passwords
- **Rate Limiting**: IP-based throttling (10 shares/15min, 50 retrievals/15min)
- **One-time Access**: Self-destructing shares after first view
- **Custom Expiry**: Flexible expiration times (5 minutes to 1 hour)
- **View Limits**: Control maximum number of views per share
- **IP Tracking**: Monitor access patterns for security

### 💼 Advanced Options
- **Custom Expiration**: 5min, 15min, 30min, 1hour, or default 24h
- **Password Protection**: Optional encryption with user-defined passwords
- **One-time Access**: Shares that automatically delete after viewing
- **Content Type Detection**: Automatic recognition of code vs text
- **Language Detection**: Smart programming language identification
- **File Upload**: Drag & drop support for text files

### 🎨 User Experience
- **Dark/Light Mode**: Automatic theme detection and manual toggle
- **Responsive Design**: Optimized for all screen sizes
- **Drag & Drop**: Intuitive file upload interface
- **Real-time Notifications**: Toast messages for all actions
- **Progressive Enhancement**: Works without JavaScript (basic functionality)
- **Accessibility**: Full keyboard navigation and screen reader support

### 🔧 Technical Features
- **WebSocket Support**: Real-time communication via Socket.IO
- **RESTful API**: Clean, documented API endpoints
- **TypeScript**: Fully typed codebase for reliability
- **MongoDB**: Scalable document storage
- **Express.js**: Fast, minimal web framework
- **Modular Architecture**: Clean separation of concerns

## 🛠 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud instance)
- npm or yarn package manager

### Quick Start
```bash
# Clone the repository
git clone <repository-url>
cd qs

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your MongoDB URI and desired port

# Build the TypeScript code
npm run build

# Start the server
npm start

# For development with auto-reload
npm run dev
```

### Environment Variables
```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/quickshare
```

## 📚 API Documentation

### Create Share
```http
POST /api/share
Content-Type: application/json

{
  "text": "Your content here",
  "password": "optional-password",
  "expiresIn": "1hour",
  "oneTimeAccess": false,
  "maxViews": 10
}
```

### Retrieve Share
```http
GET /api/share/:code
# Or for password-protected shares:
POST /api/share/:code
Content-Type: application/json

{
  "password": "user-password"
}
```

### Response Format
```json
{
  "success": true,
  "data": {
    "code": "AB12",
    "text": "Shared content",
    "language": "javascript",
    "contentType": "code",
    "createdAt": "2025-05-31T...",
    "expiresAt": "2025-06-01T...",
    "views": 1,
    "maxViews": 10,
    "oneTimeAccess": false
  }
}
```

## 🎯 Usage Examples

### Basic Text Sharing
1. Enter or paste your text
2. Click "Share Text"
3. Get a 4-character code
4. Share the code or QR code

### Advanced Code Sharing
1. Upload a code file or paste code
2. Open "Advanced Options"
3. Set password, expiry, and access limits
4. Enable one-time access if needed
5. Share the generated code

### Real-time Collaboration
1. Enable WebSocket connection
2. Share your code with collaborators
3. See live updates as content is accessed
4. Get real-time notifications

## 🏗 Architecture

### Frontend Components
- **QuickTextPro Class**: Main application controller
- **WebSocket Manager**: Real-time communication handler
- **Theme Manager**: Dark/light mode controller
- **Notification System**: Toast message handler
- **QR Code Generator**: Share code visualization
- **Syntax Highlighter**: Code beautification

### Backend Structure
```
src/
├── server.ts           # Express app & Socket.IO setup
├── config/
│   └── db.ts          # MongoDB connection
├── controllers/
│   └── shareController.ts  # Business logic
├── middleware/
│   └── rateLimiter.ts # Rate limiting
├── models/
│   └── Share.ts       # Data model
└── routes/
    ├── index.ts       # Route definitions
    └── share.ts       # Share endpoints
```

### Database Schema
```typescript
interface Share {
  code: string;           // 4-character unique code
  text: string;           // Shared content
  password?: string;      // Hashed password
  salt?: string;          // Password salt
  expiresAt: Date;        // Expiration timestamp
  oneTimeAccess: boolean; // Self-destruct flag
  contentType: string;    // 'text' | 'code'
  language?: string;      // Programming language
  ipAddress?: string;     // Creator's IP
  views: number;          // View count
  maxViews?: number;      // View limit
  isAccessed: boolean;    // Access flag
  createdAt: Date;        // Creation timestamp
}
```

## 🔐 Security Considerations

- **Password Hashing**: bcrypt with salt rounds
- **Rate Limiting**: In-memory store with automatic cleanup
- **Input Validation**: Server-side sanitization
- **CORS Configuration**: Controlled cross-origin access
- **Environment Variables**: Sensitive data protection
- **Error Handling**: No information leakage

## 🚀 Performance Optimizations

- **Database Indexing**: Optimized queries on code and expiration
- **Client-side Caching**: Reduced server requests
- **Compression**: Gzip response compression
- **Minification**: Optimized asset delivery
- **CDN Assets**: External library optimization
- **Background Cleanup**: Automatic expired content removal

## 🎨 UI/UX Features

- **Glass Morphism**: Modern translucent design
- **Smooth Animations**: CSS transitions and transforms
- **Responsive Layout**: Mobile-first design approach
- **Touch Gestures**: Mobile-optimized interactions
- **Loading States**: Clear user feedback
- **Error Handling**: Graceful degradation

## 🧪 Testing

The application includes comprehensive error handling and validation:

- Input sanitization and validation
- Network error recovery
- Graceful WebSocket disconnection handling
- Rate limiting response handling
- Password validation feedback
- File upload error handling

## 📱 Mobile Support

- Responsive design for all screen sizes
- Touch-optimized interactions
- Mobile-friendly QR code scanning
- Optimized keyboard inputs
- Reduced motion for better performance

## 🔄 Real-time Features

- Live share notifications
- Connection status indicators
- Real-time view count updates
- Instant password validation
- Live expiration warnings

## 🎛 Configuration Options

### Rate Limiting
```typescript
const shareLimit = 10;     // Shares per window
const retrieveLimit = 50;  // Retrievals per window
const windowMs = 15 * 60 * 1000; // 15 minutes
```

### Expiration Options
- 5 minutes
- 15 minutes  
- 30 minutes
- 1 hour
- 24 hours (default)

### Content Types
- Automatic detection
- Manual override
- Language-specific highlighting
- File extension recognition

## 🤝 Contributing

1. Fork the repository
## 🤝 Contributing

Contributions are welcome! Here's how you can help:

1. **Fork the repository** on GitHub
2. **Clone your fork** locally: `git clone https://github.com/YOUR_GITHUB_USERNAME/quicktext-pro.git`
3. **Create a feature branch**: `git checkout -b feature/amazing-feature`
4. **Make your changes** and add tests if applicable
5. **Commit your changes**: `git commit -m 'Add amazing feature'`
6. **Push to the branch**: `git push origin feature/amazing-feature`
7. **Open a Pull Request** on GitHub

### 🐛 Bug Reports
Found a bug? Please open an issue with:
- Clear description of the problem
- Steps to reproduce
- Expected vs actual behavior
- Browser/OS information

### 💡 Feature Requests
Have an idea? Open an issue with the `enhancement` label and describe:
- The feature you'd like to see
- Why it would be useful
- How it might work

## 📊 Repository Stats

![GitHub repo size](https://img.shields.io/github/repo-size/YOUR_GITHUB_USERNAME/quicktext-pro)
![GitHub last commit](https://img.shields.io/github/last-commit/YOUR_GITHUB_USERNAME/quicktext-pro)
![GitHub contributors](https://img.shields.io/github/contributors/YOUR_GITHUB_USERNAME/quicktext-pro)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with ❤️ using Node.js, Express, and Socket.IO
- Icons by [Font Awesome](https://fontawesome.com/)
- Syntax highlighting by [Prism.js](https://prismjs.com/)
- QR codes by [QRCode.js](https://github.com/davidshimjs/qrcodejs)

## 📞 Support

- 🐛 **Issues**: [GitHub Issues](https://github.com/YOUR_GITHUB_USERNAME/quicktext-pro/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/YOUR_GITHUB_USERNAME/quicktext-pro/discussions)
- 📧 **Contact**: [your.email@example.com](mailto:your.email@example.com)

---

⭐ **Star this repo** if you find it useful!

Made with ❤️ by [YOUR_NAME](https://github.com/YOUR_GITHUB_USERNAME)

## 🔮 Future Enhancements

- [ ] User accounts and history
- [ ] File sharing (images, documents)
- [ ] Collaboration features
- [ ] Analytics dashboard
- [ ] API rate limiting per user
- [ ] Advanced syntax themes
- [ ] Export functionality
- [ ] Share collections
- [ ] Advanced search
- [ ] Mobile app

---

**QuickText Pro** - Making text sharing simple, secure, and beautiful. 🚀
