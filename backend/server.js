'use strict';
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const helmet   = require('helmet');
const morgan   = require('morgan');
const mongoose = require('mongoose');
const rateLimit = require('express-rate-limit');
const logger   = require('./config/logger');

const app  = express();
const PORT = process.env.PORT || 5000;

// ─── SECURITY MIDDLEWARE ──────────────────────────────────────
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:3000').split(',').concat(['null']),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS']
}));
app.use(rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
  max:      parseInt(process.env.RATE_LIMIT_MAX)        || 200,
  message:  { error: 'Too many requests, please try again later.' }
}));

// ─── BODY + LOGGING ──────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined', { stream: { write: msg => logger.info(msg.trim()) } }));

// ─── STATIC (serve built frontend in production) ─────────────
app.use(express.static('../frontend'));

// ─── DATABASE ─────────────────────────────────────────────────
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/maintenx', {
      serverSelectionTimeoutMS: 5000
    });
    logger.info('✅ MongoDB connected');
  } catch (err) {
    logger.warn(`⚠️  MongoDB connection failed: ${err.message} – running without database`);
  }
};
connectDB();

mongoose.connection.on('disconnected', () => logger.warn('⚠️  MongoDB disconnected'));
mongoose.connection.on('reconnected',  () => logger.info('✅ MongoDB reconnected'));

// ─── ROUTES ──────────────────────────────────────────────────
app.use('/api/auth',      require('./routes/auth'));
app.use('/api/equipment', require('./routes/equipment'));
app.use('/api/requests',  require('./routes/requests'));
app.use('/api/teams',     require('./routes/teams'));
app.use('/api/ai',        require('./routes/ai'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/users',     require('./routes/users'));

// ─── HEALTH CHECK ─────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  const dbState = ['disconnected','connected','connecting','disconnecting'];
  res.json({
    status:    'ok',
    service:   'MaintenX AI Backend',
    version:   '2.0.0',
    db:        dbState[mongoose.connection.readyState] || 'unknown',
    uptime:    Math.floor(process.uptime()),
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development'
  });
});

// ─── SPA FALLBACK (serve index.html for any unknown route) ────
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api')) return next();
  res.sendFile(require('path').resolve('../frontend/index.html'), err => {
    if (err) next();
  });
});

// ─── 404 ──────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ error: 'Route not found', path: req.path }));

// ─── GLOBAL ERROR HANDLER ────────────────────────────────────
app.use((err, req, res, next) => {
  logger.error(`${err.status || 500} – ${err.message} – ${req.originalUrl}`);
  res.status(err.status || 500).json({
    error:   err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// ─── START ────────────────────────────────────────────────────
if (require.main === module) {
  app.listen(PORT, () => {
    logger.info(`
  ╔═══════════════════════════════════════════╗
  ║   ⚙  MAINTENX AI BACKEND v2.0.0           ║
  ║   http://localhost:${PORT}                   ║
  ║   ENV: ${(process.env.NODE_ENV || 'development').padEnd(10)}                  ║
  ╚═══════════════════════════════════════════╝`);
  });
}

module.exports = app;
