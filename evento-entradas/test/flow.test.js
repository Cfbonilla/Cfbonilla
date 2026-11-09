const test = require('node:test');
const assert = require('node:assert');
const { createApp } = require('../server');
const { openDb } = require('../db');

async function setup() {
  const app = createApp({ store: openDb(':memory:'), adminToken: 'secreto' });
  const server = app.listen(0);
  await new Promise((r) => server.once('listening', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const req = (path, { body, admin } = {}) => fetch(base + path, {
    method: body ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(admin ? { 'x-admin-token': admin } : {}) },
    body: body && JSON.stringify(body),
  });
  return { server, req };
}

const worker = {
  worker_name: 'José Pérez',
  work_area: 'Producción',
  marital_status: 'Casado/a',
  companions: 2,
  companion_names: ['María López', 'Lucía Pérez'],
};

test('registro -> código único -> QR -> validación', async (t) => {
  const { server, req } = await setup();
  t.after(() => server.close());

  const r = await req('/api/register', { body: worker });
  assert.equal(r.status, 201);
  const { ticket } = await r.json();
  assert.match(ticket.code, /^EVT-[A-Z2-9]{5}-[A-Z2-9]{5}$/);
  assert.deepEqual(ticket.companion_names, worker.companion_names);

  const qr = await req(`/api/tickets/${ticket.code}/qr.png`);
  assert.equal(qr.headers.get('content-type'), 'image/png');

  // El mismo trabajador escrito distinto (tildes, mayúsculas, espacios) no se puede registrar dos veces.
  const dup = await req('/api/register', { body: { ...worker, worker_name: '  jose   PEREZ ', companions: 0, companion_names: [] } });
  assert.equal(dup.status, 409);

  // Validación requiere token
  assert.equal((await req('/api/checkin', { body: { code: ticket.code } })).status, 401);
  assert.equal((await req('/api/checkin', { body: { code: ticket.code }, admin: 'mal' })).status, 401);

  const ok = await req('/api/checkin', { body: { code: ticket.code.toLowerCase(), staff: 'Puerta 1' }, admin: 'secreto' });
  assert.equal(ok.status, 200);
  const okBody = await ok.json();
  assert.equal(okBody.status, 'ok');
  assert.deepEqual(okBody.attendee.companion_names, worker.companion_names);

  const again = await req('/api/checkin', { body: { code: ticket.code }, admin: 'secreto' });
  assert.equal(again.status, 409);
  assert.equal((await again.json()).attendee.checked_in_by, 'Puerta 1');

  const fake = await req('/api/checkin', { body: { code: 'EVT-AAAAA-AAAAA' }, admin: 'secreto' });
  assert.equal(fake.status, 404);

  const list = await (await req('/api/attendees', { admin: 'secreto' })).json();
  assert.deepEqual(list.stats, { registered: 1, checked_in: 1, total_people: 3 });

  const csv = await (await req('/api/attendees.csv', { admin: 'secreto' })).text();
  assert.match(csv, /"María López; Lucía Pérez"/);
});

test('validación de datos', async (t) => {
  const { server, req } = await setup();
  t.after(() => server.close());
  const bad = async (body) => assert.equal((await req('/api/register', { body })).status, 400);
  await bad({ ...worker, worker_name: 'X' });
  await bad({ ...worker, work_area: '' });
  await bad({ ...worker, marital_status: 'Otro' });
  await bad({ ...worker, companions: 2, companion_names: ['Solo uno'] });   // faltan nombres
  await bad({ ...worker, companions: 1, companion_names: ['  '] });         // nombre vacío
  await bad({ ...worker, companions: 9, companion_names: Array(9).fill('Nombre Largo') });
});

test('los códigos generados no se repiten', () => {
  const store = openDb(':memory:');
  const codes = new Set();
  for (let i = 0; i < 2000; i++) {
    codes.add(store.register({ ...worker, worker_name: `Trabajador ${i}`, companion_names: [] }).code);
  }
  assert.equal(codes.size, 2000);
});
