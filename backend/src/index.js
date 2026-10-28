require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');

const authRoutes = require('./routes/auth');
const eventRoutes = require('./routes/events');
const guestRoutes = require('./routes/guests');
const taskRoutes = require('./routes/tasks');
const budgetRoutes = require('./routes/budget');
const aiRoutes = require('./routes/ai');
const publicRoutes = require('./routes/public');
const checkinRoutes = require('./routes/checkin');
const donationRoutes = require('./routes/donations');
const competitionRoutes = require('./routes/competitions');
const { errorHandler } = require('./middleware/errorHandler');
const { requestLogger } = require('./middleware/logger');

const app = express();
const PORT = process.env.PORT || 5000;

// Security
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static files
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Request logging (dev only)
if (process.env.NODE_ENV === 'development') {
  app.use(requestLogger);
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/events', guestRoutes);
app.use('/api/events', taskRoutes);
app.use('/api/events', budgetRoutes);
app.use('/api/events', donationRoutes);
app.use('/api/events', competitionRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/public', publicRoutes);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use(errorHandler);

// Start server
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`🚀 EventCEO AI Server running on http://localhost:${PORT}`);
    console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🤖 AI: ${process.env.ANTHROPIC_API_KEY ? 'Enabled (Claude)' : 'Offline fallback mode'}`);
  });
}

module.exports = app;
