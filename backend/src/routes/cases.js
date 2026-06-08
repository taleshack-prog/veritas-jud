'use strict';

const express  = require('express');
const { param, validationResult } = require('express-validator');
const { getDB }       = require('../models/database');
const { authenticate }= require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
}

// ── GET /api/cases ─────────────────────────────────────────
// Dashboard de casos com estatísticas
router.get('/', (req, res) => {
  const db = getDB();

  const cases = db.prepare(`
    SELECT
      c.id,
      c.title,
      c.company,
      c.category,
      c.status,
      c.amount,
      c.created_at,
      COUNT(DISTINCT d.id)  AS documents_count,
      COUNT(DISTINCT s.id)  AS submissions_count
    FROM complaints c
    LEFT JOIN documents   d ON d.complaint_id = c.id
    LEFT JOIN submissions s ON s.complaint_id = c.id
    WHERE c.user_id = ?
    GROUP BY c.id
    ORDER BY c.created_at DESC
  `).all(req.user.id);

  // Stats resumo
  const stats = {
    total    : cases.length,
    open     : cases.filter(c => c.status === 'open').length,
    resolved : cases.filter(c => c.status === 'resolved').length,
    in_progress: cases.filter(c => c.status === 'in_progress').length,
  };

  res.json({ cases, stats });
});

// ── GET /api/cases/:id ─────────────────────────────────────
router.get('/:id',
  param('id').isUUID(),
  validate,
  (req, res) => {
    const db = getDB();

    const complaint = db.prepare(`
      SELECT * FROM complaints WHERE id = ? AND user_id = ?
    `).get(req.params.id, req.user.id);

    if (!complaint) return res.status(404).json({ error: 'Caso não encontrado.' });

    const documents = db.prepare(`
      SELECT id, name, type, signed, created_at FROM documents
      WHERE complaint_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    const submissions = db.prepare(`
      SELECT id, channel, status, protocol, submitted_at FROM submissions
      WHERE complaint_id = ? ORDER BY created_at DESC
    `).all(req.params.id);

    res.json({
      case: {
        ...complaint,
        analysis   : complaint.analysis ? JSON.parse(complaint.analysis) : null,
        documents,
        submissions,
      },
    });
  }
);

module.exports = router;
