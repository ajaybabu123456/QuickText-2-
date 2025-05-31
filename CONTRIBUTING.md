# Contributing to QuickText Pro

Thank you for your interest in contributing to QuickText Pro! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- Git
- A GitHub account

### Setting Up Development Environment

1. **Fork the repository** on GitHub
2. **Clone your fork** locally:
   ```bash
   git clone https://github.com/YOUR_GITHUB_USERNAME/quicktext-pro.git
   cd quicktext-pro
   ```

3. **Install dependencies**:
   ```bash
   npm install
   ```

4. **Start the development server**:
   ```bash
   npm run dev
   ```

5. **Open** http://localhost:3000 in your browser

## 🔄 Development Workflow

### Branch Naming Convention
- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Adding or updating tests

### Making Changes

1. **Create a new branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes** following the coding standards below

3. **Test your changes** thoroughly:
   ```bash
   npm test  # Run tests (when available)
   npm start # Test the application
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Add: descriptive commit message"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request** on GitHub

## 📝 Coding Standards

### JavaScript/Node.js
- Use ES6+ features where appropriate
- Follow consistent indentation (2 spaces)
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions small and focused

### HTML/CSS
- Use semantic HTML elements
- Follow BEM methodology for CSS classes
- Ensure responsive design
- Test accessibility features

### Commit Messages
Use conventional commit format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `style:` Code style changes
- `refactor:` Code refactoring
- `test:` Adding tests
- `chore:` Maintenance tasks

Example: `feat: add password protection for shares`

## 🐛 Bug Reports

When reporting bugs, please include:

1. **Clear description** of the issue
2. **Steps to reproduce** the problem
3. **Expected behavior** vs **actual behavior**
4. **Browser/OS information**
5. **Screenshots** if applicable
6. **Console errors** if any

Use the bug report template when creating issues.

## 💡 Feature Requests

For feature requests, please provide:

1. **Clear description** of the feature
2. **Use case** - why is this feature needed?
3. **Proposed solution** or implementation ideas
4. **Alternative solutions** considered
5. **Additional context** or mockups

## 🧪 Testing

### Manual Testing Checklist
- [ ] Theme toggle works properly
- [ ] Share creation and retrieval
- [ ] Password protection
- [ ] QR code generation
- [ ] Real-time updates (if WebSocket enabled)
- [ ] Responsive design on different screen sizes
- [ ] Accessibility with keyboard navigation

### Code Quality
- Ensure no console errors
- Test edge cases
- Verify error handling
- Check for memory leaks in long-running features

## 📚 Architecture Overview

### Frontend
- **Alpine.js** - Reactive framework
- **Tailwind CSS** - Styling
- **Socket.IO Client** - Real-time features

### Backend
- **Express.js** - Web framework
- **Socket.IO** - WebSocket server
- **In-memory storage** - Share data (for now)

### Key Files
- `server.js` - Main server file
- `public/main.js` - Frontend Alpine.js component
- `public/index.html` - Main UI
- `public/styles.css` - Custom styles

## 🔒 Security Guidelines

- Never commit sensitive data (API keys, passwords)
- Validate all user inputs
- Use proper error handling to avoid information leakage
- Follow secure coding practices
- Report security vulnerabilities privately

## 📖 Documentation

When contributing:
- Update README.md if adding new features
- Add inline comments for complex code
- Update API documentation if changing endpoints
- Include examples in documentation

## 🎯 Priority Areas

We're especially looking for contributions in:

1. **Testing** - Unit tests, integration tests
2. **Security** - Enhanced validation, rate limiting
3. **UI/UX** - Improved user interface and experience
4. **Performance** - Optimization and caching
5. **Accessibility** - Better screen reader support
6. **Mobile** - Enhanced mobile experience

## ❓ Questions?

If you have questions:
- Check existing [GitHub Issues](https://github.com/YOUR_GITHUB_USERNAME/quicktext-pro/issues)
- Start a [GitHub Discussion](https://github.com/YOUR_GITHUB_USERNAME/quicktext-pro/discussions)
- Contact the maintainer: [your.email@example.com](mailto:your.email@example.com)

## 🙏 Recognition

Contributors will be:
- Listed in the README.md
- Mentioned in release notes
- Invited to join the maintainers team (for significant contributions)

Thank you for contributing to QuickText Pro! 🚀
