import express from 'express';
import { db } from '../db.js';
import {
  getNextTokenNumber,
  calculateEstimatedWait,
  getQueuePosition,
  findNextCustomerForBarber,
  validateStatusTransition,
  isOnlineQueueOpen,
  getTodayDateString,
  getWorkingBarbersCount,
} from '../queueLogic.js';
import {
  broadcastQueueUpdate,
  broadcastTokenCalled,
  broadcastBarbersUpdate,
  broadcastServicesUpdate,
  broadcastSettingsUpdate,
} from '../socket.js';

const router = express.Router();

// Health check
router.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Salon Queue API',
    version: '1.0.0',
  });
});

// Overview for Home screen
router.get('/overview', (req, res) => {
  try {
    const queueState = isOnlineQueueOpen();
    const waitingRows = db.prepare("SELECT COUNT(*) as count FROM queue_entries WHERE status = 'Waiting'").get();
    const waitingCount = waitingRows?.count || 0;
    const estimatedWait = calculateEstimatedWait();

    const barbers = db.prepare('SELECT * FROM barbers WHERE on_duty = 1').all();
    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    res.json({
      salonName: settingsMap.salon_name || 'Royal Crown Salon',
      closingTime: settingsMap.closing_time || '21:00',
      isOnlineQueueOpen: queueState.open,
      queueClosedReason: queueState.reason || null,
      waitingCount,
      estimatedWait,
      barbers,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Services list
router.get('/services', (req, res) => {
  try {
    const all = req.query.all === 'true';
    const query = all
      ? 'SELECT * FROM services ORDER BY category, id'
      : 'SELECT * FROM services WHERE active = 1 ORDER BY category, id';
    const services = db.prepare(query).all();
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Add service
router.post('/services', (req, res) => {
  try {
    const { name_en, name_gu, duration, price, category } = req.body;
    if (!name_en || !name_gu || !duration || !price) {
      return res.status(400).json({ error: 'Missing required service fields' });
    }
    const stmt = db.prepare(
      'INSERT INTO services (name_en, name_gu, duration, price, category, active) VALUES (?, ?, ?, ?, ?, 1)'
    );
    const result = stmt.run(name_en, name_gu, Number(duration), Number(price), category || 'General');
    const created = db.prepare('SELECT * FROM services WHERE id = ?').get(result.lastInsertRowid);
    broadcastServicesUpdate();
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin: Update service
router.put('/services/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name_en, name_gu, duration, price, category, active } = req.body;
    const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: 'Service not found' });
    }

    db.prepare(`
      UPDATE services 
      SET name_en = COALESCE(?, name_en),
          name_gu = COALESCE(?, name_gu),
          duration = COALESCE(?, duration),
          price = COALESCE(?, price),
          category = COALESCE(?, category),
          active = COALESCE(?, active)
      WHERE id = ?
    `).run(
      name_en,
      name_gu,
      duration !== undefined ? Number(duration) : null,
      price !== undefined ? Number(price) : null,
      category,
      active !== undefined ? (active ? 1 : 0) : null,
      id
    );

    const updated = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
    broadcastServicesUpdate();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Barbers list
router.get('/barbers', (req, res) => {
  try {
    const barbers = db.prepare('SELECT * FROM barbers').all();
    // Attach current customer details if serving
    const enriched = barbers.map((b) => {
      let currentCustomer = null;
      if (b.current_order_id) {
        currentCustomer = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(b.current_order_id);
        if (currentCustomer && currentCustomer.services) {
          try {
            currentCustomer.services = JSON.parse(currentCustomer.services);
          } catch {
            // keep as string
          }
        }
      }
      return { ...b, currentCustomer };
    });
    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Barber status / on_duty
router.put('/barbers/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status, on_duty } = req.body;

    const barber = db.prepare('SELECT * FROM barbers WHERE id = ?').get(id);
    if (!barber) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    if (status !== undefined) {
      db.prepare('UPDATE barbers SET status = ? WHERE id = ?').run(status, id);
    }
    if (on_duty !== undefined) {
      db.prepare('UPDATE barbers SET on_duty = ? WHERE id = ?').run(on_duty ? 1 : 0, id);
    }

    const updated = db.prepare('SELECT * FROM barbers WHERE id = ?').get(id);
    broadcastBarbersUpdate();
    broadcastQueueUpdate();
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Join Queue (Customer remote or walk-in)
router.post('/queue/join', (req, res) => {
  try {
    const { name, phone, services, preferred_barber = 'Any', source = 'remote' } = req.body;

    // Validation 1: Customer Name
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Customer name is required' });
    }

    // Validation 2: Phone number (10 digits)
    const cleanedPhone = (phone || '').replace(/\D/g, '');
    if (cleanedPhone.length !== 10) {
      return res.status(400).json({ error: 'Phone number must be exactly 10 digits' });
    }

    // Validation 3: Services (1 to 3 items)
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ error: 'Please select at least 1 service' });
    }
    if (services.length > 3) {
      return res.status(400).json({ error: 'Maximum 3 services allowed per booking' });
    }

    // Validation 4: Remote online queue status
    if (source === 'remote') {
      const queueStatus = isOnlineQueueOpen();
      if (!queueStatus.open) {
        return res.status(403).json({ error: queueStatus.reason || 'Online queue is closed' });
      }
    }

    // Validation 5: Deduplication - One active spot per phone number
    const activeEntry = db.prepare(`
      SELECT * FROM queue_entries 
      WHERE customer_phone = ? AND status IN ('Waiting', 'Called', 'In chair')
      ORDER BY id DESC LIMIT 1
    `).get(cleanedPhone);

    if (activeEntry) {
      try {
        activeEntry.services = JSON.parse(activeEntry.services);
      } catch {}
      return res.status(200).json({
        duplicate: true,
        message: 'You already have an active spot in the queue',
        entry: activeEntry,
      });
    }

    // Calculate totals
    const totalDuration = services.reduce((sum, s) => sum + (s.duration || 0), 0);
    const totalPrice = services.reduce((sum, s) => sum + (s.price || 0), 0);

    // Generate daily sequential token
    const tokenInfo = getNextTokenNumber();

    const now = new Date().toISOString();
    const insertStmt = db.prepare(`
      INSERT INTO queue_entries (
        token, token_number, token_date, customer_name, customer_phone,
        preferred_barber, services, total_duration, total_price,
        status, source, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Waiting', ?, ?)
    `);

    const result = insertStmt.run(
      tokenInfo.token,
      tokenInfo.tokenNumber,
      tokenInfo.tokenDate,
      name.trim(),
      cleanedPhone,
      preferred_barber,
      JSON.stringify(services),
      totalDuration,
      totalPrice,
      source,
      now
    );

    const newEntry = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(result.lastInsertRowid);
    newEntry.services = JSON.parse(newEntry.services);
    newEntry.position = getQueuePosition(newEntry.id);
    newEntry.estimatedWait = calculateEstimatedWait(newEntry.id);

    broadcastQueueUpdate({ entryId: newEntry.id, action: 'joined' });

    res.status(201).json(newEntry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get Queue status list
router.get('/queue', (req, res) => {
  try {
    const entries = db.prepare(`
      SELECT * FROM queue_entries 
      WHERE status IN ('Waiting', 'Called', 'In chair')
      ORDER BY 
        CASE status 
          WHEN 'In chair' THEN 1 
          WHEN 'Called' THEN 2 
          WHEN 'Waiting' THEN 3 
          ELSE 4 
        END,
        created_at ASC
    `).all();

    const enriched = entries.map((e) => {
      let parsedServices = [];
      try {
        parsedServices = JSON.parse(e.services);
      } catch {
        parsedServices = [];
      }
      return {
        ...e,
        services: parsedServices,
        position: e.status === 'Waiting' ? getQueuePosition(e.id) : 0,
        estimatedWait: e.status === 'Waiting' ? calculateEstimatedWait(e.id) : 0,
      };
    });

    res.json(enriched);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single Queue entry details
router.get('/queue/:id', (req, res) => {
  try {
    const { id } = req.params;
    const entry = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(id);
    if (!entry) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    try {
      entry.services = JSON.parse(entry.services);
    } catch {}

    entry.position = entry.status === 'Waiting' ? getQueuePosition(entry.id) : 0;
    entry.estimatedWait = entry.status === 'Waiting' ? calculateEstimatedWait(entry.id) : 0;

    res.json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Customer Cancel spot
router.post('/queue/:id/cancel', (req, res) => {
  try {
    const { id } = req.params;
    const entry = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(id);
    if (!entry) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    if (entry.status !== 'Waiting') {
      return res.status(400).json({ error: 'Can only cancel spot while in Waiting status' });
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE queue_entries SET status = 'Cancelled', cancelled_at = ? WHERE id = ?").run(now, id);

    broadcastQueueUpdate({ entryId: id, action: 'cancelled' });
    res.json({ success: true, message: 'Queue spot cancelled successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Call Next for a Barber
router.post('/barbers/:name/call-next', (req, res) => {
  try {
    const { name: barberName } = req.params;

    const barber = db.prepare('SELECT * FROM barbers WHERE name = ?').get(barberName);
    if (!barber) {
      return res.status(404).json({ error: 'Barber not found' });
    }

    if (barber.status === 'on_break') {
      return res.status(400).json({ error: `${barberName} is currently on break` });
    }

    // Check if barber already has customer in chair
    if (barber.status === 'busy' && barber.current_order_id) {
      const activeCustomer = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(barber.current_order_id);
      if (activeCustomer && activeCustomer.status === 'In chair') {
        return res.status(400).json({ error: `${barberName} currently has a customer in the chair` });
      }
    }

    // Find earliest eligible waiting customer
    const nextCustomer = findNextCustomerForBarber(barberName);
    if (!nextCustomer) {
      return res.status(404).json({ error: `No waiting customers eligible for ${barberName}` });
    }

    const now = new Date().toISOString();

    // Move nextCustomer status: Waiting -> Called
    db.prepare(`
      UPDATE queue_entries 
      SET status = 'Called', assigned_barber = ?, called_at = ?
      WHERE id = ?
    `).run(barberName, now, nextCustomer.id);

    // Update barber status
    db.prepare('UPDATE barbers SET status = ?, current_order_id = ? WHERE id = ?').run(
      'busy',
      nextCustomer.id,
      barber.id
    );

    const updatedCustomer = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(nextCustomer.id);
    try {
      updatedCustomer.services = JSON.parse(updatedCustomer.services);
    } catch {}

    broadcastTokenCalled({
      token: updatedCustomer.token,
      customer_name: updatedCustomer.customer_name,
      assigned_barber: barberName,
      entryId: updatedCustomer.id,
    });
    broadcastBarbersUpdate();

    res.json(updatedCustomer);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Queue Entry status (Start service, Complete, No-Show)
router.post('/queue/:id/status', (req, res) => {
  try {
    const { id } = req.params;
    const { status: newStatus } = req.body;

    const entry = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(id);
    if (!entry) {
      return res.status(404).json({ error: 'Queue entry not found' });
    }

    if (!validateStatusTransition(entry.status, newStatus)) {
      return res.status(400).json({
        error: `Invalid status transition from '${entry.status}' to '${newStatus}'. Statuses are forward-only.`,
      });
    }

    const now = new Date().toISOString();

    if (newStatus === 'In chair') {
      db.prepare(`
        UPDATE queue_entries 
        SET status = 'In chair', started_at = ? 
        WHERE id = ?
      `).run(now, id);

      if (entry.assigned_barber) {
        db.prepare(`
          UPDATE barbers 
          SET status = 'busy', current_order_id = ?, service_started_at = ? 
          WHERE name = ?
        `).run(id, now, entry.assigned_barber);
      }
    } else if (newStatus === 'Done') {
      db.prepare(`
        UPDATE queue_entries 
        SET status = 'Done', completed_at = ? 
        WHERE id = ?
      `).run(now, id);

      if (entry.assigned_barber) {
        db.prepare(`
          UPDATE barbers 
          SET status = 'free', current_order_id = NULL, service_started_at = NULL 
          WHERE name = ?
        `).run(entry.assigned_barber);
      }
    } else if (newStatus === 'No-show') {
      db.prepare(`
        UPDATE queue_entries 
        SET status = 'No-show', no_show_at = ? 
        WHERE id = ?
      `).run(now, id);

      if (entry.assigned_barber) {
        db.prepare(`
          UPDATE barbers 
          SET status = 'free', current_order_id = NULL, service_started_at = NULL 
          WHERE name = ?
        `).run(entry.assigned_barber);
      }
    }

    const updated = db.prepare('SELECT * FROM queue_entries WHERE id = ?').get(id);
    try {
      updated.services = JSON.parse(updated.services);
    } catch {}

    broadcastQueueUpdate({ entryId: id, status: newStatus });
    broadcastBarbersUpdate();

    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin stats
router.get('/admin/stats', (req, res) => {
  try {
    const today = getTodayDateString();

    const servedRow = db.prepare(`
      SELECT COUNT(*) as count, SUM(total_price) as revenue 
      FROM queue_entries 
      WHERE status = 'Done' AND token_date = ?
    `).get(today);

    const noShowRow = db.prepare(`
      SELECT COUNT(*) as count 
      FROM queue_entries 
      WHERE status = 'No-show' AND token_date = ?
    `).get(today);

    // Compute average wait time from created_at to started_at for completed entries
    const completedRows = db.prepare(`
      SELECT created_at, started_at 
      FROM queue_entries 
      WHERE status = 'Done' AND started_at IS NOT NULL AND token_date = ?
    `).all(today);

    let avgWaitMinutes = 18; // default realistic baseline
    if (completedRows.length > 0) {
      const totalMinutes = completedRows.reduce((sum, r) => {
        const diff = (new Date(r.started_at) - new Date(r.created_at)) / (60 * 1000);
        return sum + Math.max(1, diff);
      }, 0);
      avgWaitMinutes = Math.round(totalMinutes / completedRows.length);
    }

    const settings = db.prepare('SELECT * FROM settings').all();
    const settingsMap = Object.fromEntries(settings.map((s) => [s.key, s.value]));

    res.json({
      customersServed: servedRow?.count || 0,
      totalRevenue: servedRow?.revenue || 0,
      noShows: noShowRow?.count || 0,
      averageWaitMinutes: avgWaitMinutes,
      onlineQueueOpen: settingsMap.online_queue_open === 'true',
      closingTime: settingsMap.closing_time || '21:00',
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin update settings
router.post('/admin/settings', (req, res) => {
  try {
    const { online_queue_open, closing_time } = req.body;
    if (online_queue_open !== undefined) {
      db.prepare(`
        INSERT INTO settings (key, value) VALUES ('online_queue_open', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(online_queue_open ? 'true' : 'false');
    }
    if (closing_time !== undefined) {
      db.prepare(`
        INSERT INTO settings (key, value) VALUES ('closing_time', ?)
        ON CONFLICT(key) DO UPDATE SET value = excluded.value
      `).run(closing_time);
    }

    broadcastSettingsUpdate();
    broadcastQueueUpdate();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
