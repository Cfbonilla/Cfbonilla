const express = require('express');
const crypto = require('node:crypto');
const path = require('node:path');
const QRCode = require('qrcode');
const { openDb } = require('./db');

const MARITAL_STATUSES = ['Soltero/a', 'Casado/a', 'Unión libre', 'Divorciado/a', 'Viudo/a'];
const MAX_COMPANIONS = Number(process.env.MAX_COMPANIONS) || 5;
const CODE_RE = /^EVT-[A-Z0-9]{5}-[A-Z0-9]{5}$/;

function normalizeCode(c) {
  return String(c || '').trim().toUpperCase();
}

// Quita espacios sobrantes y limita la longitud.
function clean(v, max = 120) {
  return typeof v === 'string' ? v.replace(/\s+/g, ' ').trim().slice(0, max) : '';
}

function publicTicket(r) {
  return {
    code: r.code,
    worker_name: r.worker_name,
    work_area: r.work_area,
    companions: r.companions,
    companion_names: r.companion_names,
    created_at: r.created_at,
    checked_in_at: r.checked_in_at,
  };
}

function createApp({ store = openDb(), adminToken = process.env.ADMIN_TOKEN, eventName = process.env.EVENT_NAME || 'Navidad Paraíso 2026' } = {}) {
  const app = express();
  app.use(express.json({ limit: '20kb' }));
  app.use(express.static(path.join(__dirname, 'public')));

  app.get('/api/config', (_req, res) => res.json({ eventName, maritalStatuses: MARITAL_STATUSES, maxCompanions: MAX_COMPANIONS }));

  // 1) Datos del trabajador + 2) acompañantes -> 3) devuelve código único.
  app.post('/api/register', (req, res) => {
    const b = req.body || {};
    const names = Array.isArray(b.companion_names) ? b.companion_names.map((n) => clean(n)) : [];
    const data = {
      worker_name: clean(b.worker_name),
      work_area: clean(b.work_area, 80),
      marital_status: clean(b.marital_status, 40),
      companion_names: names,
    };
    const companions = Number.parseInt(b.companions ?? names.length, 10);

    const errors = [];
    if (data.worker_name.length < 3) errors.push('El nombre del trabajador es obligatorio.');
    if (data.work_area.length < 2) errors.push('El área de trabajo es obligatoria.');
    if (!MARITAL_STATUSES.includes(data.marital_status)) errors.push('Selecciona un estado civil.');
    if (!Number.isInteger(companions) || companions < 0 || companions > MAX_COMPANIONS) {
      errors.push(`Acompañantes debe ser entre 0 y ${MAX_COMPANIONS}.`);
    } else if (names.length !== companions || names.some((n) => n.length < 3)) {
      errors.push('Escribe el nombre completo de cada acompañante.');
    }
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });

    try {
      const reg = store.register(data);
      res.status(201).json({ ticket: publicTicket(reg), ticketUrl: `/ticket.html?code=${reg.code}` });
    } catch (err) {
      res.status(err.status || 500).json({ error: err.status ? err.message : 'Error interno.' });
    }
  });

  // Consulta pública de una entrada (solo con el código, que es secreto e impredecible).
  app.get('/api/tickets/:code', (req, res) => {
    const r = store.findByCode(normalizeCode(req.params.code));
    if (!r) return res.status(404).json({ error: 'Entrada no encontrada.' });
    res.json({ ticket: publicTicket(r), eventName });
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
      ok: 'Acceso permitido. ¡Bienvenido/a!',
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
    const cols = [
      ['code', 'Código'], ['worker_name', 'Trabajador'], ['work_area', 'Área'], ['marital_status', 'Estado civil'],
      ['companions', 'Acompañantes'], ['companion_names', 'Nombres de acompañantes'],
      ['created_at', 'Registrado (UTC)'], ['checked_in_at', 'Ingresó (UTC)'], ['checked_in_by', 'Validado por'],
    ];
    const esc = (v) => {
      let s = v == null ? '' : Array.isArray(v) ? v.join('; ') : String(v);
      if (/^[=+\-@]/.test(s)) s = `'${s}`; // evita inyección de fórmulas en Excel
      return `"${s.replace(/"/g, '""')}"`;
    };
    const rows = store.list().map((r) => cols.map(([k]) => esc(r[k])).join(';'));
    // Separador ";" para que Excel en español lo abra en columnas directamente.
    const csv = [cols.map(([, h]) => esc(h)).join(';'), ...rows].join('\r\n');
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
    console.log(`Registro:      http://localhost:${port}/`);
    console.log(`Organizadores: http://localhost:${port}/admin.html`);
  });
}

module.exports = { createApp, MARITAL_STATUSES };
