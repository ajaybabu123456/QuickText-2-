const express = require('express');
const path = require('path');
const apiHandler = require('./api/index.js');

const app = express();

// Serve static files
app.use(express.static('public'));

// API routes
app.all('/api/*', async (req, res) => {
    // Forward to our API handler
    await apiHandler(req, res);
});

app.get('/health', async (req, res) => {
    await apiHandler(req, res);
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📂 Test codes available: TEST, DB5M`);
});