/* ============================================
   KSSFK - Express Server Application
   ============================================ */

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

// Serve static files
app.use(express.static(path.join(__dirname, '../')));

// Middleware for logging
const logMiddleware = require('./middleware/logMiddleware');
app.use(logMiddleware);

// Authentication middleware
const authMiddleware = require('./middleware/auth');

// Routes
app.use('/api/schools', require('./routes/schools'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', authMiddleware, require('./routes/admin'));
app.use('/api/payments', require('./routes/payments'));
app.use('/api/uploads', require('./routes/uploads'));
app.use('/api/vacancies', require('./routes/vacancies'));
app.use('/api/jobs', require('./routes/jobs'));
app.use('/api/penalties', require('./routes/penalties'));

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'Server is running', timestamp: new Date().toISOString() });
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error Handler
app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

// Start server
app.listen(PORT, () => {
    console.log(`KSSFK Server is running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
