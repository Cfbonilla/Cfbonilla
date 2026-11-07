const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../server');
const { openDb } = require('../db');

async function setup() {
  const app = createApp({ store: openDb(':memory:'), adminToken: 'secreto' });
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const req = (path, { body, admin, method } = {}) => fetch(base + path, {
    method: method || (body ? 'POST' : 'GET'),
    headers: { 'Content-Type': 'application/json', ...(admin ? { 'x-admin-token': admin } : {}) },
    body: body && JSON.stringify(body),
  });
  return { server, req };
}

const person = { full_name: 'Ana Pérez', email: 'ana@example.com', document_id: '123.456', ticket_type: 'General', companions: 1 };

test('registro -> código único -> QR -> validación', async (t) => {
  const { server, req } = await setup();
  t.after(() => server.close());

  const r = await req('/api/register', { body: person });
  assert.equal(r.status, 201);
  const { ticket } = await r.json();
  assert.match(ticket.code, /^EVT-[A-Z2-9]{5}-[A-Z2-9]{5}$/);

  const qr = await req(`/api/tickets/${ticket.code}/qr.png`);
  assert.equal(qr.headers.get('content-type'), 'image/png');

  // Registro duplicado (mismo correo, distinto formato) rechazado
  const dup = await req('/api/register', { body: { ...person, email: 'ANA@example.com', document_id: '' } });
  assert.equal(dup.status, 409);
  const dupDoc = await req('/api/register', { body: { ...person, email: 'otra@example.com', document_id: '123456' } });
  assert.equal(dupDoc.status, 409);

  // Validación requiere token
  assert.equal((await req('/api/checkin', { body: { code: ticket.code } })).status, 401);
  assert.equal((await req('/api/checkin', { body: { code: ticket.code }, admin: 'mal' })).status, 401);

  const ok = await req('/api/checkin', { body: { code: ticket.code.toLowerCase(), staff: 'Puerta 1' }, admin: 'secreto' });
  assert.equal(ok.status, 200);
  assert.equal((await ok.json()).status, 'ok');

  const again = await req('/api/checkin', { body: { code: ticket.code }, admin: 'secreto' });
  assert.equal(again.status, 409);
  assert.equal((await again.json()).attendee.checked_in_by, 'Puerta 1');

  const fake = await req('/api/checkin', { body: { code: 'EVT-AAAAA-AAAAA' }, admin: 'secreto' });
  assert.equal(fake.status, 404);

  const list = await (await req('/api/attendees', { admin: 'secreto' })).json();
  assert.deepEqual(list.stats, { registered: 1, checked_in: 1, total_people: 2 });
});

test('validación de datos', async (t) => {
  const { server, req } = await setup();
  t.after(() => server.close());
  const r = await req('/api/register', { body: { full_name: 'X', email: 'no', ticket_type: 'Nope' } });
  assert.equal(r.status, 400);
});

test('los códigos generados no se repiten', () => {
  const store = openDb(':memory:');
  const codes = new Set();
  for (let i = 0; i < 2000; i++) codes.add(store.register({ ...person, email: `u${i}@x.com`, document_id: String(i), ticket_type: 'General' }).code);
  assert.equal(codes.size, 2000);
});
