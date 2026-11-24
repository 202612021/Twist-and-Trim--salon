import test from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = 'http://localhost:5000/api';

test('E2E 1: Health check endpoint', async () => {
  const res = await fetch(`${BASE_URL}/health`);
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.status, 'ok');
});

test('E2E 2: Fetch Services and Barbers', async () => {
  const [sRes, bRes] = await Promise.all([
    fetch(`${BASE_URL}/services`),
    fetch(`${BASE_URL}/barbers`),
  ]);
  assert.equal(sRes.status, 200);
  assert.equal(bRes.status, 200);
  const services = await sRes.json();
  const barbers = await bRes.json();
  assert.ok(services.length >= 6);
  assert.ok(barbers.length >= 3);
});

test('E2E 3: Customer joins queue with 2 services', async () => {
  const payload = {
    name: 'Suresh Patel',
    phone: '9825012345',
    services: [
      { id: 1, name_en: 'Haircut', name_gu: 'હેરકટ', duration: 30, price: 150 },
      { id: 2, name_en: 'Beard Trim', name_gu: 'દાઢી સેટિંગ', duration: 15, price: 80 },
    ],
    preferred_barber: 'Any',
    source: 'remote',
  };

  const res = await fetch(`${BASE_URL}/queue/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 201);
  const data = await res.json();
  assert.ok(data.token.startsWith('S-'));
  assert.equal(data.customer_name, 'Suresh Patel');
  assert.equal(data.total_duration, 45);
  assert.equal(data.total_price, 230);
  assert.equal(data.status, 'Waiting');
});

test('E2E 4: Duplicate phone number joins again -> returns existing spot', async () => {
  const payload = {
    name: 'Suresh Patel',
    phone: '9825012345',
    services: [{ id: 1, name_en: 'Haircut', duration: 30, price: 150 }],
  };

  const res = await fetch(`${BASE_URL}/queue/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.duplicate, true);
  assert.equal(data.entry.customer_phone, '9825012345');
});

test('E2E 5: Input validation rejections (Invalid phone, missing name, >3 services)', async () => {
  // Invalid phone (less than 10 digits)
  const badPhoneRes = await fetch(`${BASE_URL}/queue/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test',
      phone: '12345',
      services: [{ id: 1, duration: 30, price: 150 }],
    }),
  });
  assert.equal(badPhoneRes.status, 400);

  // Missing name
  const badNameRes = await fetch(`${BASE_URL}/queue/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: '   ',
      phone: '9898989898',
      services: [{ id: 1, duration: 30, price: 150 }],
    }),
  });
  assert.equal(badNameRes.status, 400);

  // Greater than 3 services
  const badServicesRes = await fetch(`${BASE_URL}/queue/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Test',
      phone: '9898989898',
      services: [
        { id: 1, duration: 30, price: 150 },
        { id: 2, duration: 15, price: 80 },
        { id: 3, duration: 20, price: 100 },
        { id: 4, duration: 40, price: 200 },
      ],
    }),
  });
  assert.equal(badServicesRes.status, 400);
});

test('E2E 6: Call Next, Status Transitions & Forward-Only enforcement', async () => {
  // Free barber Amit if busy
  const barbersRes = await fetch(`${BASE_URL}/barbers`);
  const barbers = await barbersRes.json();
  const amit = barbers.find((b) => b.name === 'Amit');
  assert.ok(amit);

  // Call Next for Amit
  const callRes = await fetch(`${BASE_URL}/barbers/Amit/call-next`, { method: 'POST' });
  assert.equal(callRes.status, 200);
  const calledCustomer = await callRes.json();
  assert.equal(calledCustomer.status, 'Called');
  assert.equal(calledCustomer.assigned_barber, 'Amit');

  // Customer tries to cancel after being called -> rejected!
  const cancelRes = await fetch(`${BASE_URL}/queue/${calledCustomer.id}/cancel`, { method: 'POST' });
  assert.equal(cancelRes.status, 400);

  // Transition: Called -> In chair
  const inChairRes = await fetch(`${BASE_URL}/queue/${calledCustomer.id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'In chair' }),
  });
  assert.equal(inChairRes.status, 200);
  const inChairCust = await inChairRes.json();
  assert.equal(inChairCust.status, 'In chair');

  // Illegal backward transition: In chair -> Waiting (must be rejected!)
  const backwardRes = await fetch(`${BASE_URL}/queue/${calledCustomer.id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Waiting' }),
  });
  assert.equal(backwardRes.status, 400);

  // Transition: In chair -> Done
  const doneRes = await fetch(`${BASE_URL}/queue/${calledCustomer.id}/status`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'Done' }),
  });
  assert.equal(doneRes.status, 200);
  const doneCust = await doneRes.json();
  assert.equal(doneCust.status, 'Done');
});

test('E2E 7: Online queue closure rejects remote, allows walk-ins', async () => {
  // Close online queue
  await fetch(`${BASE_URL}/admin/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ online_queue_open: false }),
  });

  // Remote customer attempt -> rejected with 403
  const remoteRes = await fetch(`${BASE_URL}/queue/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'Remote Guy',
      phone: '9111111111',
      services: [{ id: 1, duration: 30, price: 150 }],
      source: 'remote',
    }),
  });
  assert.equal(remoteRes.status, 403);

  // Walk-in customer attempt -> allowed (201)
  const walkInRes = await fetch(`${BASE_URL}/queue/join`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'WalkIn Guy',
      phone: '9222222222',
      services: [{ id: 1, duration: 30, price: 150 }],
      source: 'walk-in',
    }),
  });
  assert.equal(walkInRes.status, 201);

  // Restore online queue open
  await fetch(`${BASE_URL}/admin/settings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ online_queue_open: true }),
  });
});
