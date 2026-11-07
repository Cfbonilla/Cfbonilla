// Capa de datos: SQLite integrado en Node (node:sqlite), sin dependencias nativas.
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

// Alfabeto sin caracteres ambiguos (sin 0/O, 1/I/L) para que el código se pueda dictar o teclear.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function randomCode() {
  // 10 caracteres de 31 símbolos ≈ 49 bits de entropía: imposible de adivinar por fuerza bruta razonable.
  const bytes = crypto.randomBytes(10);
  let raw = '';
  for (const b of bytes) raw += ALPHABET[b % ALPHABET.length];
  return `EVT-${raw.slice(0, 5)}-${raw.slice(5)}`;
}

function openDb(file = process.env.DB_FILE || path.join(__dirname, 'data', 'evento.db')) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS attendees (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      code           TEXT NOT NULL UNIQUE,
      full_name      TEXT NOT NULL,
      email          TEXT NOT NULL UNIQUE COLLATE NOCASE,
      phone          TEXT,
      document_id    TEXT UNIQUE,
      ticket_type    TEXT NOT NULL,
      companions     INTEGER NOT NULL DEFAULT 0,
      dietary        TEXT,
      notes          TEXT,
      created_at     TEXT NOT NULL DEFAULT (datetime('now')),
      checked_in_at  TEXT,
      checked_in_by  TEXT
    );
  `);

  const insertStmt = db.prepare(`
    INSERT INTO attendees (code, full_name, email, phone, document_id, ticket_type, companions, dietary, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const byCode = db.prepare('SELECT * FROM attendees WHERE code = ?');
  // Check-in atómico: solo actualiza si todavía no se ha usado, evitando dobles ingresos simultáneos.
  const checkInStmt = db.prepare(`
    UPDATE attendees SET checked_in_at = datetime('now'), checked_in_by = ?
    WHERE code = ? AND checked_in_at IS NULL
  `);

  return {
    db,

    register(a) {
      // Reintenta si (muy improbablemente) el código aleatorio ya existe.
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = randomCode();
        try {
          insertStmt.run(code, a.full_name, a.email, a.phone || null, a.document_id || null,
            a.ticket_type, a.companions || 0, a.dietary || null, a.notes || null);
          return byCode.get(code);
        } catch (err) {
          const msg = String(err.message);
          if (msg.includes('attendees.code')) continue;
          if (msg.includes('attendees.email')) throw Object.assign(new Error('Este correo ya está registrado.'), { status: 409 });
          if (msg.includes('attendees.document_id')) throw Object.assign(new Error('Este documento ya está registrado.'), { status: 409 });
          throw err;
        }
      }
      throw new Error('No se pudo generar un código único, intenta de nuevo.');
    },

    findByCode(code) {
      return byCode.get(code) || null;
    },

    checkIn(code, by) {
      const attendee = byCode.get(code);
      if (!attendee) return { status: 'invalid' };
      const result = checkInStmt.run(by || null, code);
      if (result.changes === 0) return { status: 'already_used', attendee };
      return { status: 'ok', attendee: byCode.get(code) };
    },

    list() {
      return db.prepare('SELECT * FROM attendees ORDER BY created_at DESC, id DESC').all();
    },

    stats() {
      return db.prepare(`
        SELECT COUNT(*) AS registered,
               COALESCE(SUM(checked_in_at IS NOT NULL), 0) AS checked_in,
               COALESCE(SUM(1 + companions), 0) AS total_people
        FROM attendees
      `).get();
    },
  };
}

module.exports = { openDb, randomCode, ALPHABET };
