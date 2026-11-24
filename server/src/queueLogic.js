import { db } from './db.js';

export function getTodayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getNextTokenNumber() {
  const today = getTodayDateString();
  const row = db.prepare('SELECT MAX(token_number) as max_num FROM queue_entries WHERE token_date = ?').get(today);
  const nextNum = (row && row.max_num) ? row.max_num + 1 : 1;
  return {
    tokenNumber: nextNum,
    token: `S-${nextNum}`,
    tokenDate: today,
  };
}

export function getActiveBarbers() {
  return db.prepare('SELECT * FROM barbers WHERE on_duty = 1').all();
}

export function getWorkingBarbersCount() {
  // Barbers on duty and not on break
  const rows = db.prepare("SELECT COUNT(*) as count FROM barbers WHERE on_duty = 1 AND status != 'on_break'").get();
  return Math.max(1, rows.count || 1);
}

export function calculateEstimatedWait(targetEntryId = null) {
  const workingBarbers = getWorkingBarbersCount();
  
  if (!targetEntryId) {
    // Total wait time for a new customer joining now
    const waitingRows = db.prepare("SELECT total_duration FROM queue_entries WHERE status = 'Waiting'").all();
    const totalMinutes = waitingRows.reduce((sum, r) => sum + (r.total_duration || 0), 0);
    return Math.max(5, Math.round(totalMinutes / workingBarbers));
  }

  // Get target entry
  const target = db.prepare('SELECT id, created_at, status FROM queue_entries WHERE id = ?').get(targetEntryId);
  if (!target || target.status !== 'Waiting') {
    return 0;
  }

  // Waiting entries ahead of target
  const aheadRows = db.prepare(`
    SELECT total_duration FROM queue_entries 
    WHERE status = 'Waiting' AND (created_at < ? OR (created_at = ? AND id < ?))
  `).all(target.created_at, target.created_at, target.id);

  const minutesAhead = aheadRows.reduce((sum, r) => sum + (r.total_duration || 0), 0);
  return Math.max(5, Math.round(minutesAhead / workingBarbers));
}

export function getQueuePosition(entryId) {
  const target = db.prepare('SELECT id, created_at, status FROM queue_entries WHERE id = ?').get(entryId);
  if (!target || target.status !== 'Waiting') {
    return 0;
  }
  const countRow = db.prepare(`
    SELECT COUNT(*) as count FROM queue_entries 
    WHERE status = 'Waiting' AND (created_at < ? OR (created_at = ? AND id <= ?))
  `).get(target.created_at, target.created_at, target.id);
  return countRow.count || 1;
}

export function findNextCustomerForBarber(barberName) {
  // FCFS: picks the earliest waiting customer who chose barberName OR 'Any'
  const customer = db.prepare(`
    SELECT * FROM queue_entries 
    WHERE status = 'Waiting' AND (preferred_barber = ? OR preferred_barber = 'Any')
    ORDER BY created_at ASC, id ASC
    LIMIT 1
  `).get(barberName);

  return customer || null;
}

export function validateStatusTransition(currentStatus, newStatus) {
  const validTransitions = {
    'Waiting': ['Called', 'Cancelled'],
    'Called': ['In chair', 'No-show'],
    'In chair': ['Done'],
    'Done': [],
    'Cancelled': [],
    'No-show': [],
  };

  const allowed = validTransitions[currentStatus] || [];
  return allowed.includes(newStatus);
}

export function isOnlineQueueOpen() {
  const setting = db.prepare("SELECT value FROM settings WHERE key = 'online_queue_open'").get();
  if (setting && setting.value === 'false') {
    return { open: false, reason: 'Queue closed by owner' };
  }

  const closingSetting = db.prepare("SELECT value FROM settings WHERE key = 'closing_time'").get();
  const closingTime = closingSetting?.value || '21:00';
  const [closeHour, closeMin] = closingTime.split(':').map(Number);

  const now = new Date();
  const closingDate = new Date();
  closingDate.setHours(closeHour, closeMin, 0, 0);

  // Online joining closes 30 minutes before closing
  const cutoffDate = new Date(closingDate.getTime() - 30 * 60 * 1000);

  if (now >= cutoffDate && now <= closingDate) {
    return { open: false, reason: 'Online joining closes 30 minutes before closing time' };
  }

  if (now > closingDate) {
    return { open: false, reason: 'Salon is currently closed' };
  }

  return { open: true };
}
