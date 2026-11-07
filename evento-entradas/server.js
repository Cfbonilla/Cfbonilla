const express = require('express');
const crypto = require('node:crypto');
const path = require('node:path');
const QRCode = require('qrcode');
const { openDb } = require('./db');

const TICKET_TYPES = ['General', 'VIP', 'Estudiante', 'Prensa'];
const CODE_RE = /^EVT-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

function normalizeCode(c) {
  return String(c || '').trim().toUpperCase();
}

function clean(v, max = 200) {
  return typeof v === 'string' ? v.trim().slice(0, max) : '';
}

function publicTicket(a) {
  return {
    code: a.code,
    full_name: a.full_name,
    ticket_type: a.ticket_type,
    companions: a.companions,
    created_at: a.created_at,
    checked_in_at: a.checked_in_at,
  };
}

function createApp({ store = openDb(), adminToken = process.env.ADMIN_TOKEN, eventName = process.env.EVENT_NAME || 'Mi Evento' } = {}) {
  const app = express();
  app.use(express.json({ limit: '20kb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/config', (_req, res) => res.json({ eventName, ticketTypes: TICKET_TYPES }));

  // 1) Registro de usuario + 2) detalles de asistencia -> 3) devuelve código único.
  app.post('/api/register', (req, res) => {
    const b = req.body || {};
    const data = {
      full_name: clean(b.full_name, 120),
      email: clean(b.email, 160).toLowerCase(),
      phone: clean(b.phone, 40),
      document_id: clean(b.document_id, 40).toUpperCase().replace(/[\s.-]/g, ''),
      ticket_type: clean(b.ticket_type, 40),
      companions: Number.parseInt(b.companions ?? 0, 10),
      dietary: clean(b.dietary, 200),
      notes: clean(b.notes, 500),
    };

    const errors = [];
    if (data.full_name.length < 3) errors.push('El nombre es obligatorio.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.push('El correo no es válido.');
    if (!TICKET_TYPES.includes(data.ticket_type)) errors.push('Tipo de entrada no válido.');
    if (!Number.isInteger(data.companions) || data.companions < 0 || data.companions > 5) errors.push('Acompañantes debe ser entre 0 y 5.');
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    try {
      const attendee = store.register(data);
      res.status(201).json({ ticket: publicTicket(attendee), ticketUrl: `/ticket.html?code=${attendee.code}` });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.status ? err.message : 'Error interno.' });
    }
  });

  // Consulta pública de una entrada (solo con el código, que es secreto e impredecible).
  app.get('/api/tickets/:code', (req, res) => {
    const a = store.findByCode(normalizeCode(req.params.code));
    if (!a) return res.status(404).json({ error: 'Entrada no encontrada.' });
    res.json({ ticket: publicTicket(a), eventName });
  });

  app.get('/api/tickets/:code/qr.png', async (req, res) => {
    const code = normalizeCode(req.params.code);
    if (!CODE_RE.test(code) || !store.findByCode(code)) return res.status(404).end();
    const png = await QRCode.toBuffer(code, { width: 360, margin: 2, errorCorrectionLevel: 'M' });
    res.type('png').set('Cache-Control', 'private, max-age=3600').send(png);
  });

  // 4) Validación por organizadores (protegido con token).
  function requireAdmin(req, res, next) {
    const given = Buffer.from(String(req.get('x-admin-token') || ''));
    const expected = Buffer.from(String(adminToken));
    if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
      return res.status(401).json({ error: 'Token de organizador inválido.' });
    }
    next();
  }

  app.post('/api/checkin', requireAdmin, (req, res) => {
    const code = normalizeCode(req.body?.code);
    if (!CODE_RE.test(code)) return res.status(400).json({ status: 'invalid', message: 'Formato de código inválido.' });
    const result = store.checkIn(code, clean(req.body?.staff, 60) || 'organizador');
    const messages = {
      ok: 'Acceso permitido. Bienvenido/a.',
      already_used: 'ATENCIÓN: esta entrada ya fue usada.',
      invalid: 'Código no registrado. Acceso denegado.',
    };
    res.status(result.status === 'invalid' ? 404 : result.status === 'already_used' ? 409 : 200)
      .json({ status: result.status, message: messages[result.status], attendee: result.attendee || null });
  });

  app.get('/api/attendees', requireAdmin, (_req, res) => {
    res.json({ stats: store.stats(), attendees: store.list() });
  });

  app.get('/api/attendees.csv', requireAdmin, (_req, res) => {
    const cols = ['code', 'full_name', 'email', 'phone', 'document_id', 'ticket_type', 'companions', 'dietary', 'notes', 'created_at', 'checked_in_at', 'checked_in_by'];
    const esc = (v) => {
      let s = v == null ? '' : String(v);
      if (/^[=+\-@]/.test(s)) s = `'${s}`; // evita inyección de fórmulas en Excel
      return `"${s.replace(/"/g, '""')}"`;
    };
    const csv = [cols.join(','), ...store.list().map((r) => cols.map((c) => esc(r[c])).join(','))].join('\n');
    res.type('text/csv').attachment('asistentes.csv').send('﻿' + csv);
  });

  return app;
}

if (require.main === module) {
  let adminToken = process.env.ADMIN_TOKEN;
  if (!adminToken) {
    adminToken = crypto.randomBytes(12).toString('hex');
    console.log(`\n⚠  ADMIN_TOKEN no definido. Token temporal de organizador: ${adminToken}\n`);
  }
  const port = Number(process.env.PORT) || 3000;
  createApp({ adminToken }).listen(port, () => {
    console.log(`Registro:     http://localhost:${port}/`);
    console.log(`Organizadores: http://localhost:${port}/admin.html`);
  });
}

module.exports = { createApp };
