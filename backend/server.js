require('dotenv').config();
process.env.TZ = 'Asia/Manila';
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const { testConnection } = require('./utils/db');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Security middleware
app.use(helmet());
const allowedOrigins = new Set(
  (process.env.FRONTEND_URL || 'http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.has(origin)) return callback(null, true);
    const error = new Error('Origin not allowed by CORS.');
    error.statusCode = 403;
    return callback(error);
  },
  credentials: false,
}));

// Rate limiting
const limiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 300, message: 'Too many requests, please try again later.' });
app.use('/api/', limiter);

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// Logging
if (process.env.NODE_ENV !== 'test') app.use(morgan('dev'));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/services', require('./routes/services'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/technicians', require('./routes/technicians'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/admin', require('./routes/admin'));

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// 404
app.use((req, res) => res.status(404).json({ success: false, message: 'Route not found.' }));

// Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

const validateEnvironment = () => {
  if (
    !process.env.JWT_SECRET
    || process.env.JWT_SECRET.length < 32
    || /replace_with|smart_service_jwt_secret/i.test(process.env.JWT_SECRET)
  ) {
    throw new Error('JWT_SECRET must be a unique secret of at least 32 characters.');
  }
};

const start = async () => {
  validateEnvironment();
  await testConnection();
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Smart Service API running on http://localhost:${PORT}`);
    console.log(`📋 Environment: ${process.env.NODE_ENV || 'development'}`);
  });
};

if (require.main === module) {
  start().catch((error) => {
    console.error('API startup failed:', error.message);
    process.exitCode = 1;
  });
}

module.exports = app;
