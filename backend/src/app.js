require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');
const fs = require('fs');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ── CORS — allow all origins always ──────────────────────────
app.use(cors({
  origin: '*',
  credentials: false, // must be false when origin is *
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
}));
app.options('*', cors());

// ── Security headers ─────────────────────────────────────────
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
});

// ── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Logging ──────────────────────────────────────────────────
app.use(morgan('dev', { stream: { write: (msg) => logger.info(msg.trim()) } }));

// ── Serve React static assets FIRST (before API routes) ──────
const frontendDist = path.resolve(__dirname, '../../frontend/dist');
const distExists = fs.existsSync(frontendDist);

if (distExists) {
  // Serve static files (JS, CSS, images) with correct MIME types
  app.use(express.static(frontendDist, {
    maxAge: '1d',
    etag: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.js'))  res.setHeader('Content-Type', 'application/javascript');
      if (filePath.endsWith('.css')) res.setHeader('Content-Type', 'text/css');
      if (filePath.endsWith('.mjs')) res.setHeader('Content-Type', 'application/javascript');
    },
  }));
  logger.info(`Serving frontend from: ${frontendDist}`);
}

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/super-admin', require('./routes/superAdmin'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api',             require('./routes/user'));
app.use('/api/subjects',    require('./routes/subjects'));
app.use('/api/students',    require('./routes/students'));

// ── Health check ─────────────────────────────────────────────
app.get('/health', (req, res) => res.json({
  status: 'ok',
  timestamp: new Date(),
  distExists,
  distPath: frontendDist,
}));

// ── SPA fallback — serve index.html for all non-API routes ───
if (distExists) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(frontendDist, 'index.html'));
  });
}

// ── 404 for unknown API routes ───────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.path} not found` }));

// ── Global error handler ─────────────────────────────────────
app.use(errorHandler);

module.exports = app;
