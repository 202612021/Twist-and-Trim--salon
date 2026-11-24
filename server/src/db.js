import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dataDir = path.join(__dirname, '../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'salon.db');
export const db = new DatabaseSync(dbPath);

// Enable foreign keys and WAL mode for high performance
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS barbers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      status TEXT NOT NULL DEFAULT 'free', -- 'free', 'busy', 'on_break'
      on_duty INTEGER NOT NULL DEFAULT 1,
      avatar TEXT DEFAULT '',
      current_order_id INTEGER NULL,
      service_started_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS services (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name_en TEXT NOT NULL,
      name_gu TEXT NOT NULL,
      duration INTEGER NOT NULL,
      price INTEGER NOT NULL,
      category TEXT NOT NULL,
      active INTEGER NOT NULL DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS queue_entries (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      token TEXT UNIQUE NOT NULL,
      token_number INTEGER NOT NULL,
      token_date TEXT NOT NULL,
      customer_name TEXT NOT NULL,
      customer_phone TEXT NOT NULL,
      preferred_barber TEXT NOT NULL DEFAULT 'Any',
      assigned_barber TEXT NULL,
      services TEXT NOT NULL,
      total_duration INTEGER NOT NULL,
      total_price INTEGER NOT NULL,
      status TEXT NOT NULL DEFAULT 'Waiting',
      source TEXT NOT NULL DEFAULT 'remote',
      created_at TEXT NOT NULL,
      called_at TEXT NULL,
      started_at TEXT NULL,
      completed_at TEXT NULL,
      cancelled_at TEXT NULL,
      no_show_at TEXT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  // Seed default barbers if empty
  const barberCount = db.prepare('SELECT COUNT(*) as count FROM barbers').get().count;
  if (barberCount === 0) {
    const insertBarber = db.prepare('INSERT INTO barbers (name, status, on_duty, avatar) VALUES (?, ?, ?, ?)');
    insertBarber.run('Ravi', 'busy', 1, '👨🏽‍🦱');
    insertBarber.run('Amit', 'free', 1, '👨🏻‍🦰');
    insertBarber.run('Imran', 'on_break', 1, '🧔🏽');
  }

  // Seed default services if empty
  const serviceCount = db.prepare('SELECT COUNT(*) as count FROM services').get().count;
  if (serviceCount === 0) {
    const insertService = db.prepare(
      'INSERT INTO services (name_en, name_gu, duration, price, category, active) VALUES (?, ?, ?, ?, ?, ?)'
    );
    insertService.run('Haircut', 'હેરકટ (વાળ કાપવા)', 30, 150, 'Hair', 1);
    insertService.run('Beard Trim', 'દાઢી સેટિંગ', 15, 80, 'Beard', 1);
    insertService.run('Hair Spa', 'હેર સ્પા', 45, 400, 'Treatment', 1);
    insertService.run('Head Massage', 'માથાની માલિશ', 20, 120, 'Massage', 1);
    insertService.run('Shave', 'શેવિંગ', 15, 70, 'Beard', 1);
    insertService.run('Hair Color', 'વાળનો કલર', 40, 350, 'Hair', 1);
  }

  // Seed default settings if empty
  const getSetting = db.prepare('SELECT value FROM settings WHERE key = ?');
  if (!getSetting.get('online_queue_open')) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('online_queue_open', 'true');
  }
  if (!getSetting.get('closing_time')) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('closing_time', '21:00');
  }
  if (!getSetting.get('salon_name')) {
    db.prepare('INSERT INTO settings (key, value) VALUES (?, ?)').run('salon_name', 'Twist and Trim');
  } else {
    db.prepare("UPDATE settings SET value = 'Twist and Trim' WHERE key = 'salon_name'").run();
  }
}
