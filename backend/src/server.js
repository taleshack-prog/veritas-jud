'use strict';

require('express-async-errors');
require('dotenv').config();

const express    = require('express');
const cors       = require('cors');
const helmet     = require('helmet');
const morgan     = require('morgan');
const rateLimit  = require('express-rate-limit');
const compression = require('compression');
const path       = require('path');

const logger     = require('./services/logger');
const { initDB } = require('./models/database');

// ── Rotas ──────────────────────────────────────────────────
const authRoutes       = require('./routes/auth');
const complaintRoutes  = require('./routes/complaints');
const documentRoutes   = require('./routes/documents');
const caseRoutes       = require('./routes/cases');
const marketplaceRoutes = require('./routes/marketplace');

// ── App ────────────────────────────────────────────────────
const app  = express();
const PORT = process.env.PORT || 3000;

// ── Segurança ──────────────────────────────────────────────
app.use(helmet());

const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:8081')
  .split(',')
  .map(o => o.trim());

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS bloqueado para origem: ${origin}`));
  },
  credentials: true,
}));

// ── Rate Limiting ──────────────────────────────────────────
const limiter = rateLimit({
  windowMs : Number(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max      : Number(process.env.RATE_LIMIT_MAX)        || 100,
  standardHeaders: true,
  legacyHeaders  : false,
  message: { error: 'Muitas requisições. Tente novamente em alguns minutos.' },
});
app.use('/api/', limiter);

// ── Parsers / Compressão ───────────────────────────────────
app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ── Logs HTTP ──────────────────────────────────────────────
app.use(morgan('combined', {
  stream: { write: msg => logger.http(msg.trim()) },
}));

// ── Rotas ──────────────────────────────────────────────────
app.use('/api/auth',        authRoutes);
app.use('/api/complaints',  complaintRoutes);
app.use('/api/documents',   documentRoutes);
app.use('/api/cases',       caseRoutes);
app.use('/api/marketplace', marketplaceRoutes);

// Health check
app.get('/health', (_req, res) => {
  res.json({
    status   : 'OK',
    version  : '1.0.0',
    timestamp: new Date().toISOString(),
    env      : process.env.NODE_ENV,
  });
});

// ── Tratamento de Erros ────────────────────────────────────
// Rota não encontrada
app.use((_req, res) => {
  res.status(404).json({ error: 'Endpoint não encontrado.' });
});

// Erro global
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  logger.error(`${err.status || 500} — ${err.message}`, { stack: err.stack });

  const isDev = process.env.NODE_ENV === 'development';
  res.status(err.status || 500).json({
    error  : err.message || 'Erro interno do servidor.',
    ...(isDev && { stack: err.stack }),
  });
});

// ── Boot ───────────────────────────────────────────────────
async function boot() {
  try {
    await initDB();
    app.listen(PORT, () => {
      logger.info(`🚀 Veritas Backend rodando em http://localhost:${PORT} [${process.env.NODE_ENV}]`);
    });
  } catch (err) {
    logger.error('Falha ao iniciar servidor:', err);
    process.exit(1);
  }
}

boot();

module.exports = app; // exporta para testes
