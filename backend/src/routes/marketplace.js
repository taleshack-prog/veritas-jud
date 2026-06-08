'use strict';

const express  = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { getDB }        = require('../models/database');
const { authenticate, authorize } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
}

// ── GET /api/marketplace/lawyers ──────────────────────────
// Lista advogados disponíveis, filtrando por especialidade/estado
router.get('/lawyers', (req, res) => {
  const db = getDB();
  const { state, specialty } = req.query;

  let query = `
    SELECT l.id, u.name, l.oab_number, l.state, l.specialties,
           l.bio, l.rating, l.reviews_count
    FROM lawyers l
    JOIN users u ON u.id = l.user_id
    WHERE l.active = 1
  `;
  const params = [];

  if (state) {
    query += ' AND l.state = ?';
    params.push(state.toUpperCase());
  }
  if (specialty) {
    query += ' AND l.specialties LIKE ?';
    params.push(`%${specialty}%`);
  }

  query += ' ORDER BY l.rating DESC LIMIT 50';

  const lawyers = db.prepare(query).all(...params);
  res.json({ lawyers: lawyers.map(l => ({
    ...l,
    specialties: l.specialties ? l.specialties.split(',') : [],
  })) });
});

// ── POST /api/marketplace/register-lawyer ─────────────────
// Advogado se cadastra na plataforma
router.post('/register-lawyer',
  [
    body('oab_number').trim().notEmpty().withMessage('Número OAB é obrigatório.'),
    body('state').isLength({ min: 2, max: 2 }).withMessage('Sigla do estado inválida.'),
    body('specialties').isArray({ min: 1 }).withMessage('Informe pelo menos uma especialidade.'),
    body('bio').optional().isLength({ max: 500 }),
  ],
  validate,
  (req, res) => {
    const { oab_number, state, specialties, bio } = req.body;
    const db = getDB();

    const exists = db.prepare('SELECT id FROM lawyers WHERE oab_number = ?').get(oab_number);
    if (exists) return res.status(409).json({ error: 'OAB já cadastrada.' });

    const id = uuidv4();
    db.prepare(`
      INSERT INTO lawyers (id, user_id, oab_number, state, specialties, bio)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, req.user.id, oab_number, state.toUpperCase(),
        specialties.join(','), bio || null);

    // Atualiza role do usuário
    db.prepare("UPDATE users SET role = 'lawyer' WHERE id = ?").run(req.user.id);

    res.status(201).json({ message: 'Advogado cadastrado com sucesso.', lawyer_id: id });
  }
);

// ── POST /api/marketplace/leads ───────────────────────────
// Envia uma reclamação como lead para advogados
router.post('/leads',
  [
    body('complaint_id').isUUID().withMessage('ID da reclamação inválido.'),
    body('lawyer_ids').isArray({ min: 1, max: 3 }).withMessage('Informe 1 a 3 advogados.'),
  ],
  validate,
  (req, res) => {
    const { complaint_id, lawyer_ids } = req.body;
    const db = getDB();

    const complaint = db.prepare(`
      SELECT * FROM complaints WHERE id = ? AND user_id = ?
    `).get(complaint_id, req.user.id);

    if (!complaint) return res.status(404).json({ error: 'Reclamação não encontrada.' });

    const LEAD_PRICE = 50.00; // R$ 50,00 por lead

    const insertLead = db.prepare(`
      INSERT INTO leads (id, complaint_id, lawyer_id, price)
      VALUES (?, ?, ?, ?)
    `);

    const ids = [];
    for (const lawyerId of lawyer_ids) {
      const lawyer = db.prepare('SELECT id FROM lawyers WHERE id = ?').get(lawyerId);
      if (!lawyer) continue;

      const id = uuidv4();
      insertLead.run(id, complaint_id, lawyerId, LEAD_PRICE);
      ids.push(id);
    }

    res.status(201).json({
      message: `Lead enviado para ${ids.length} advogado(s).`,
      lead_ids: ids,
    });
  }
);

module.exports = router;
