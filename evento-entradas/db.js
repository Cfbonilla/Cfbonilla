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

// Clave para detectar cédulas duplicadas: ignora puntos, guiones, espacios y mayúsculas
// ("1.234.567-8" == "12345678").
function idKey(idNumber) {
  return String(idNumber).replace(/[^0-9a-z]/gi, '').toUpperCase();
}

function rowToRecord(row) {
  if (!row) return null;
  const { id_key, companion_names, ...rest } = row;
  return { ...rest, companion_names: JSON.parse(companion_names || '[]') };
}

function openDb(file = process.env.DB_FILE || path.join(__dirname, 'data', 'evento.db')) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS workers (
      id               INTEGER PRIMARY KEY AUTOINCREMENT,
      code             TEXT NOT NULL UNIQUE,
      worker_name      TEXT NOT NULL,
      id_number        TEXT NOT NULL,
      id_key           TEXT NOT NULL UNIQUE,
      work_area        TEXT NOT NULL,
      marital_status   TEXT NOT NULL,
      companions       INTEGER NOT NULL DEFAULT 0,
      companion_names  TEXT NOT NULL DEFAULT '[]',
      created_at       TEXT NOT NULL DEFAULT (datetime('now')),
      checked_in_at    TEXT,
      checked_in_by    TEXT
    );
  `);

  const insertStmt = db.prepare(`
    INSERT INTO workers (code, worker_name, id_number, id_key, work_area, marital_status, companions, companion_names)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const byCode = db.prepare('SELECT * FROM workers WHERE code = ?');
  // Check-in atómico: solo actualiza si todavía no se ha usado, evitando dobles ingresos simultáneos.
  const checkInStmt = db.prepare(`
    UPDATE workers SET checked_in_at = datetime('now'), checked_in_by = ?
    WHERE code = ? AND checked_in_at IS NULL
  `);

  return {
    db,

    register(r) {
      // Reintenta si (muy improbablemente) el código aleatorio ya existe.
      for (let attempt = 0; attempt < 5; attempt++) {
        const code = randomCode();
        try {
          insertStmt.run(code, r.worker_name, r.id_number, idKey(r.id_number), r.work_area, r.marital_status,
            r.companion_names.length, JSON.stringify(r.companion_names));
          return rowToRecord(byCode.get(code));
        } catch (err) {
          const msg = String(err.message);
          if (msg.includes('workers.code')) continue;
          if (msg.includes('workers.id_key')) {
            throw Object.assign(new Error('Esta cédula ya está registrada. Si perdiste tu código, contacta a los organizadores.'), { status: 409 });
          }
          throw err;
        }
      }
      throw new Error('No se pudo generar un código único, intenta de nuevo.');
    },

    findByCode(code) {
      return rowToRecord(byCode.get(code));
    },

    checkIn(code, by) {
      const reg = byCode.get(code);
      if (!reg) return { status: 'invalid' };
      const result = checkInStmt.run(by || null, code);
      if (result.changes === 0) return { status: 'already_used', attendee: rowToRecord(reg) };
      return { status: 'ok', attendee: rowToRecord(byCode.get(code)) };
    },

    list() {
      return db.prepare('SELECT * FROM workers ORDER BY created_at DESC, id DESC').all().map(rowToRecord);
    },

    stats() {
      return db.prepare(`
        SELECT COUNT(*) AS registered,
               COALESCE(SUM(checked_in_at IS NOT NULL), 0) AS checked_in,
               COALESCE(SUM(1 + companions), 0) AS total_people
        FROM workers
      `).get();
    },
  };
}

module.exports = { openDb, randomCode, idKey, ALPHABET };
