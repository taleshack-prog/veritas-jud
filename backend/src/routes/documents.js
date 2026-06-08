'use strict';

const express  = require('express');
const { body, param, validationResult } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const { PDFDocument, StandardFonts, rgb } = require('pdf-lib');
const { getDB }           = require('../models/database');
const { authenticate }    = require('../middleware/auth');
const { generateDocument } = require('../services/openaiService');

const router = express.Router();
router.use(authenticate);

function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  next();
}

// ── POST /api/documents/generate ──────────────────────────
// Gera documento via IA e salva no banco
router.post('/generate',
  [
    body('complaint_id').isUUID().withMessage('ID da reclamação inválido.'),
    body('type').isIn(['notification', 'jec_petition', 'procon_complaint'])
      .withMessage('Tipo de documento inválido.'),
  ],
  validate,
  async (req, res) => {
    const { complaint_id, type } = req.body;
    const db = getDB();

    // Verifica se a reclamação pertence ao usuário
    const complaint = db.prepare(`
      SELECT * FROM complaints WHERE id = ? AND user_id = ?
    `).get(complaint_id, req.user.id);

    if (!complaint) {
      return res.status(404).json({ error: 'Reclamação não encontrada.' });
    }

    const typeLabels = {
      notification   : 'Notificação Extrajudicial',
      jec_petition   : 'Petição JEC',
      procon_complaint: 'Reclamação Procon',
    };

    // Gera conteúdo via IA
    const content = await generateDocument({
      type,
      complaint: {
        ...complaint,
        analysis: complaint.analysis ? JSON.parse(complaint.analysis) : null,
      },
      userName: req.user.name,
    });

    const id   = uuidv4();
    const name = `${typeLabels[type]} - ${complaint.company} - ${new Date().toLocaleDateString('pt-BR')}`;

    db.prepare(`
      INSERT INTO documents (id, complaint_id, user_id, type, name, content)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, complaint_id, req.user.id, type, name, content);

    res.status(201).json({
      document: { id, name, type, content, complaint_id },
    });
  }
);

// ── GET /api/documents ─────────────────────────────────────
router.get('/', (req, res) => {
  const db = getDB();
  const rows = db.prepare(`
    SELECT d.id, d.name, d.type, d.signed, d.created_at, c.company
    FROM documents d
    JOIN complaints c ON c.id = d.complaint_id
    WHERE d.user_id = ? ORDER BY d.created_at DESC
  `).all(req.user.id);

  res.json({ documents: rows });
});

// ── GET /api/documents/:id ─────────────────────────────────
router.get('/:id',
  param('id').isUUID(),
  validate,
  (req, res) => {
    const db = getDB();
    const doc = db.prepare(`
      SELECT d.*, c.company, c.description AS complaint_description
      FROM documents d
      JOIN complaints c ON c.id = d.complaint_id
      WHERE d.id = ? AND d.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!doc) return res.status(404).json({ error: 'Documento não encontrado.' });
    res.json({ document: doc });
  }
);

// ── GET /api/documents/:id/pdf ─────────────────────────────
// Gera e retorna o documento como PDF
router.get('/:id/pdf',
  param('id').isUUID(),
  validate,
  async (req, res) => {
    const db = getDB();
    const doc = db.prepare(`
      SELECT d.*, c.company FROM documents d
      JOIN complaints c ON c.id = d.complaint_id
      WHERE d.id = ? AND d.user_id = ?
    `).get(req.params.id, req.user.id);

    if (!doc) return res.status(404).json({ error: 'Documento não encontrado.' });

    try {
      const pdfDoc = await PDFDocument.create();
      const font   = await pdfDoc.embedFont(StandardFonts.Helvetica);
      const bold   = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

      const PAGE_WIDTH  = 595.28; // A4
      const PAGE_HEIGHT = 841.89;
      const MARGIN      = 60;
      const LINE_HEIGHT = 16;
      const FONT_SIZE   = 11;

      let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      let y    = PAGE_HEIGHT - MARGIN;

      // Cabeçalho
      page.drawText('VERITAS — Defesa do Consumidor', {
        x: MARGIN, y, font: bold, size: 14, color: rgb(0.09, 0.31, 0.82),
      });
      y -= LINE_HEIGHT * 2;

      page.drawText(doc.name, {
        x: MARGIN, y, font: bold, size: 12, color: rgb(0.1, 0.1, 0.1),
      });
      y -= LINE_HEIGHT;

      page.drawLine({
        start: { x: MARGIN, y }, end: { x: PAGE_WIDTH - MARGIN, y },
        thickness: 0.5, color: rgb(0.7, 0.7, 0.7),
      });
      y -= LINE_HEIGHT * 1.5;

      // Corpo — quebra por linhas
      const lines = doc.content.split('\n');
      for (const rawLine of lines) {
        // Quebra linha longa em pedaços
        const words    = rawLine.split(' ');
        let   current  = '';

        for (const word of words) {
          const test = current ? `${current} ${word}` : word;
          const w    = font.widthOfTextAtSize(test, FONT_SIZE);

          if (w > PAGE_WIDTH - MARGIN * 2) {
            page.drawText(current, { x: MARGIN, y, font, size: FONT_SIZE, color: rgb(0.1, 0.1, 0.1) });
            y       -= LINE_HEIGHT;
            current  = word;
          } else {
            current = test;
          }

          if (y < MARGIN + LINE_HEIGHT * 3) {
            page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
            y    = PAGE_HEIGHT - MARGIN;
          }
        }

        if (current) {
          page.drawText(current, { x: MARGIN, y, font, size: FONT_SIZE, color: rgb(0.1, 0.1, 0.1) });
        }
        y -= LINE_HEIGHT;

        if (y < MARGIN + LINE_HEIGHT * 3) {
          page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
          y    = PAGE_HEIGHT - MARGIN;
        }
      }

      // Rodapé
      page.drawText(
        'Documento gerado pelo Veritas — ferramenta de automação documental. Consulte um advogado inscrito na OAB.',
        { x: MARGIN, y: MARGIN / 2, font, size: 8, color: rgb(0.5, 0.5, 0.5) }
      );

      const pdfBytes = await pdfDoc.save();

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="veritas_${doc.id}.pdf"`);
      res.send(Buffer.from(pdfBytes));

    } catch (err) {
      throw new Error(`Falha ao gerar PDF: ${err.message}`);
    }
  }
);

module.exports = router;
