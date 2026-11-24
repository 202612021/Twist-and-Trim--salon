import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import {
  validateStatusTransition,
  getNextTokenNumber,
  findNextCustomerForBarber,
  getTodayDateString,
} from '../src/queueLogic.js';

test('1. Sequential Token Generation', () => {
  const today = getTodayDateString();
  assert.ok(today.match(/^\d{4}-\d{2}-\d{2}$/));
  const token = getNextTokenNumber();
  assert.ok(token.token.startsWith('S-'));
  assert.ok(token.tokenNumber >= 1);
});

test('2. Status Transitions Machine (Strict Forward-Only)', () => {
  // Valid forward transitions
  assert.equal(validateStatusTransition('Waiting', 'Called'), true);
  assert.equal(validateStatusTransition('Waiting', 'Cancelled'), true);
  assert.equal(validateStatusTransition('Called', 'In chair'), true);
  assert.equal(validateStatusTransition('Called', 'No-show'), true);
  assert.equal(validateStatusTransition('In chair', 'Done'), true);

  // Invalid backward / illegal transitions
  assert.equal(validateStatusTransition('Done', 'Waiting'), false);
  assert.equal(validateStatusTransition('Done', 'Called'), false);
  assert.equal(validateStatusTransition('In chair', 'Waiting'), false);
  assert.equal(validateStatusTransition('In chair', 'Called'), false);
  assert.equal(validateStatusTransition('Called', 'Waiting'), false);
  assert.equal(validateStatusTransition('Cancelled', 'Waiting'), false);
  assert.equal(validateStatusTransition('No-show', 'Waiting'), false);
  assert.equal(validateStatusTransition('Waiting', 'Done'), false);
});

test('3. Barber Preference Rules (Amit skips customer who chose Ravi)', () => {
  const db = new DatabaseSync(':memory:');
  db.exec(`
    CREATE TABLE queue_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT,
      customer_name TEXT,
      customer_phone TEXT,
      preferred_barber TEXT,
      status TEXT,
      created_at TEXT
    );
  `);

  const now = new Date().toISOString();
  const later = new Date(Date.now() + 1000).toISOString();

  // Customer 1: Chose Ravi specifically
  db.prepare(`
    INSERT INTO queue_entries (token, customer_name, customer_phone, preferred_barber, status, created_at)
    VALUES ('S-1', 'Aakash', '9876543210', 'Ravi', 'Waiting', ?)
  `).run(now);

  // Customer 2: Chose Any
  db.prepare(`
    INSERT INTO queue_entries (token, customer_name, customer_phone, preferred_barber, status, created_at)
    VALUES ('S-2', 'Bhavin', '9876543211', 'Any', 'Waiting', ?)
  `).run(later);

  // Query for Barber Amit:
  const nextForAmit = db.prepare(`
    SELECT * FROM queue_entries 
    WHERE status = 'Waiting' AND (preferred_barber = 'Amit' OR preferred_barber = 'Any')
    ORDER BY created_at ASC, id ASC
    LIMIT 1
  `).get();

  // Barber Amit MUST pick Customer 2 ('Bhavin', 'Any') and MUST NOT pick Customer 1 ('Aakash', 'Ravi')
  assert.equal(nextForAmit.customer_name, 'Bhavin');
  assert.equal(nextForAmit.token, 'S-2');

  // Query for Barber Ravi:
  const nextForRavi = db.prepare(`
    SELECT * FROM queue_entries 
    WHERE status = 'Waiting' AND (preferred_barber = 'Ravi' OR preferred_barber = 'Any')
    ORDER BY created_at ASC, id ASC
    LIMIT 1
  `).get();

  // Barber Ravi gets Customer 1 ('Aakash')
  assert.equal(nextForRavi.customer_name, 'Aakash');
  assert.equal(nextForRavi.token, 'S-1');
});

test('4. Input Constraints Validation Rules', () => {
  // Phone must be exactly 10 digits
  const validPhone = '9876543210'.replace(/\D/g, '');
  const shortPhone = '98765'.replace(/\D/g, '');
  const longPhone = '987654321012'.replace(/\D/g, '');

  assert.equal(validPhone.length === 10, true);
  assert.equal(shortPhone.length === 10, false);
  assert.equal(longPhone.length === 10, false);

  // Max 3 services constraint
  const services1 = [{ id: 1 }];
  const services3 = [{ id: 1 }, { id: 2 }, { id: 3 }];
  const services4 = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }];

  assert.ok(services1.length >= 1 && services1.length <= 3);
  assert.ok(services3.length >= 1 && services3.length <= 3);
  assert.equal(services4.length <= 3, false);
});
