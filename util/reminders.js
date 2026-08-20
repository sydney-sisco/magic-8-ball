// Reminder storage and time parsing (SQLite).
// Shared by the chatbot `reminder` tool and the direct !remindme / !reminders /
// !cancelreminder commands. Reminders persist across restarts; the scheduler in
// features/reminders.js polls this table for due reminders.
const chrono = require('chrono-node');
const db = require('./db.js');

const DEFAULT_REMINDER_HOUR = 9; // when a day is given without a time

db.exec(`
  CREATE TABLE IF NOT EXISTS reminders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    channel_id TEXT,
    text TEXT NOT NULL,
    remind_at INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_reminders_due
    ON reminders (status, remind_at);
`);

// converts a chrono parse result into a Date, defaulting day-only refs to 9:00 AM
const toRemindDate = (start) => {
  const remindAt = start.date();
  if (!('hour' in start.knownValues)) {
    remindAt.setHours(DEFAULT_REMINDER_HOUR, 0, 0, 0);
  }
  return remindAt;
};

// parses a bare time phrase ("in 1 hour", "on friday", "tomorrow at 3pm") into a Date
const parseWhen = (when) => {
  const results = chrono.parse(when, new Date(), { forwardDate: true });
  if (!results.length) {
    throw new Error(`Could not understand when "${when}". Try something like "in 1 hour", "in 30 minutes", "tomorrow at 3pm", or "on friday".`);
  }
  return toRemindDate(results[0].start);
};

// parses a free-form string ("take out the trash in 1 hour") into { text, when, remindAt }
// the time phrase can appear anywhere; the rest becomes the reminder text
const parseReminderText = (input) => {
  const results = chrono.parse(input, new Date(), { forwardDate: true });
  if (!results.length) {
    throw new Error(`Could not find a time in "${input}". Try something like: !remindme take out the trash in 1 hour`);
  }

  const result = results[0];
  const when = result.text;
  const text = `${input.slice(0, result.index)} ${input.slice(result.index + result.text.length)}`
    .replace(/\s+/g, ' ')
    .trim();

  if (!text) {
    throw new Error('What should I remind you about? e.g. `!remindme take out the trash in 1 hour`');
  }

  const remindAt = toRemindDate(result.start);
  if (remindAt.getTime() <= Date.now()) {
    throw new Error(`"${when}" is in the past. Please pick a future time.`);
  }

  return { text, when, remindAt };
};

const storeReminder = ({ userId, channelId, text, remindAt }) => {
  const info = db.prepare(`
    INSERT INTO reminders (user_id, channel_id, text, remind_at, status, created_at)
    VALUES (?, ?, ?, ?, 'pending', ?)
  `).run(userId, channelId, text, remindAt.getTime(), Date.now());

  return {
    id: Number(info.lastInsertRowid),
    userId,
    channelId,
    text,
    remindAt,
  };
};

const getDueReminders = (now = Date.now()) => {
  return db.prepare(`
    SELECT * FROM reminders
    WHERE status = 'pending' AND remind_at <= ?
    ORDER BY remind_at ASC
  `).all(now);
};

const markFired = (id) => {
  db.prepare(`UPDATE reminders SET status = 'fired' WHERE id = ?`).run(id);
};

const listPendingReminders = (userId) => {
  return db.prepare(`
    SELECT * FROM reminders
    WHERE user_id = ? AND status = 'pending'
    ORDER BY remind_at ASC
  `).all(userId);
};

// returns recently resolved (fired/cancelled) reminders for the user — used as
// context so the LLM doesn't have to guess about past reminders from memory
const getRecentReminders = (userId, sinceMs = 24 * 60 * 60 * 1000, limit = 10) => {
  return db.prepare(`
    SELECT * FROM reminders
    WHERE user_id = ? AND status != 'pending' AND remind_at > ?
    ORDER BY remind_at DESC
    LIMIT ?
  `).all(userId, Date.now() - sinceMs, limit);
};

// cancels a pending reminder if it belongs to the given user;
// returns the cancelled reminder row, or null if nothing was cancelled
const cancelReminder = (id, userId) => {
  const row = db.prepare(`
    SELECT * FROM reminders
    WHERE id = ? AND user_id = ? AND status = 'pending'
  `).get(id, userId);
  if (!row) return null;

  db.prepare(`UPDATE reminders SET status = 'cancelled' WHERE id = ?`).run(id);
  return row;
};

module.exports = {
  storeReminder,
  getDueReminders,
  markFired,
  listPendingReminders,
  getRecentReminders,
  cancelReminder,
  parseWhen,
  parseReminderText,
};
