'use strict';

const express  = require('express');
const bcrypt   = require('bcryptjs');
const jwt      = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body, validationResult } = require('express-validator');
const { getDB } = require('../models/database');

const router = express.Router();

// ── Helpers ────────────────────────────────────────────────
function generateToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).json({ errors: errors.array() });
  }
  next();
}

// ── POST /api/auth/register ────────────────────────────────
router.post('/register',
  [
    body('name').trim().notEmpty().withMessage('Nome é obrigatório.'),
    body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
    body('password').isLength({ min: 8 }).withMessage('Senha mínima de 8 caracteres.'),
  ],
  validate,
  (req, res) => {
    const { name, email, password } = req.body;
    const db = getDB();

    const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
    if (exists) {
      return res.status(409).json({ error: 'E-mail já cadastrado.' });
    }

    const hash = bcrypt.hashSync(password, 12);
    const id   = uuidv4();

    db.prepare(`
      INSERT INTO users (id, email, name, password, role)
      VALUES (?, ?, ?, ?, 'consumer')
    `).run(id, email, name, hash);

    const token = generateToken(id);
    res.status(201).json({
      message: 'Cadastro realizado com sucesso.',
      token,
      user: { id, name, email, role: 'consumer' },
    });
  }
);

// ── POST /api/auth/login ───────────────────────────────────
router.post('/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('E-mail inválido.'),
    body('password').notEmpty().withMessage('Senha é obrigatória.'),
  ],
  validate,
  (req, res) => {
    const { email, password } = req.body;
    const db = getDB();

    const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    if (!user || !bcrypt.compareSync(password, user.password)) {
      return res.status(401).json({ error: 'E-mail ou senha incorretos.' });
    }

    const token = generateToken(user.id);
    res.json({
      token,
      user: {
        id   : user.id,
        name : user.name,
        email: user.email,
        role : user.role,
      },
    });
  }
);

// ── GET /api/auth/me ───────────────────────────────────────
const { authenticate } = require('../middleware/auth');

router.get('/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
