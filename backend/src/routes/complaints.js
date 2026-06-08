'use strict';

const express  = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDB }         = require('../models/database');
const { authenticate }  = require('../middleware/auth');
const { analyzeComplaint, chatWithUser } = require('../services/openaiService');

const router = express.Router();
router.use(authenticate);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
}

// ── POST /api/complaints ───────────────────────────────────
// Cria nova reclamação e já roda análise de IA
router.post('/',
  [
    body('description').trim().notEmpty().isLength({ min: 20 })
      .withMessage('Descreva o problema com pelo menos 20 caracteres.'),
    body('company').trim().notEmpty().withMessage('Informe a empresa.'),
    body('title').trim().notEmpty().withMessage('Título é obrigatório.'),
    body('amount').optional().isFloat({ min: 0 }).withMessage('Valor deve ser numérico positivo.'),
  ],
  validate,
  async (req, res) => {
    const { title, description, company, amount } = req.body;
    const db = getDB();

    // Analisa com IA (pode levar alguns segundos)
    let analysis = null;
    try {
      analysis = await analyzeComplaint(description, company);
    } catch (_err) {
      // Análise falhou — cria reclamação mesmo assim, sem análise
    }

    const id       = uuidv4();
    const category = analysis?.category || 'other';

    db.prepare(`
      INSERT INTO complaints (id, user_id, title, description, category, company, amount, analysis, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
    `).run(id, req.user.id, title, description, category, company, amount || null,
        analysis ? JSON.stringify(analysis) : null);

    const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(id);

    res.status(201).json({
      complaint: {
        ...complaint,
        analysis: complaint.analysis ? JSON.parse(complaint.analysis) : null,
      },
    });
  }
);

// ── GET /api/complaints ────────────────────────────────────
// Lista todas as reclamações do usuário logado
router.get('/', (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT id, title, company, category, status, amount, created_at
    FROM complaints WHERE user_id = ? ORDER BY created_at DESC
  `).all(req.user.id);

  res.json({ complaints: rows });
});

// ── GET /api/complaints/:id ────────────────────────────────
router.get('/:id',
  param('id').isUUID().withMessage('ID inválido.'),
  validate,
  (req, res) => {
    const db = getDB();
    const row = db.prepare(`
      SELECT c.*, GROUP_CONCAT(s.channel || ':' || s.status) AS submissions
      FROM complaints c
      LEFT JOIN submissions s ON s.complaint_id = c.id
      WHERE c.id = ? AND c.user_id = ?
      GROUP BY c.id
    `).get(req.params.id, req.user.id);

    if (!row) return res.status(404).json({ error: 'Reclamação não encontrada.' });

    res.json({
      complaint: {
        ...row,
        analysis   : row.analysis    ? JSON.parse(row.analysis)    : null,
        submissions: row.submissions ? row.submissions.split(',') : [],
      },
    });
  }
);

// ── PATCH /api/complaints/:id/status ──────────────────────
router.patch('/:id/status',
  [
    param('id').isUUID(),
    body('status').isIn(['open', 'in_progress', 'resolved', 'closed'])
      .withMessage('Status inválido.'),
  ],
  validate,
  (req, res) => {
    const db = getDB();
    const result = db.prepare(`
      UPDATE complaints SET status = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ? AND user_id = ?
    `).run(req.body.status, req.params.id, req.user.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Reclamação não encontrada.' });
    res.json({ message: 'Status atualizado com sucesso.' });
  }
);

// ── POST /api/complaints/chat ──────────────────────────────
// Chat contínuo com IA sobre uma reclamação
router.post('/chat',
  body('messages').isArray({ min: 1 }).withMessage('Histórico de mensagens é obrigatório.'),
  validate,
  async (req, res) => {
    const reply = await chatWithUser(req.body.messages);
    res.json({ reply });
  }
);

module.exports = router;
