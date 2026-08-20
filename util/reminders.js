// Reminder storage (SQLite).
// Reminders are persisted so they survive bot restarts; the scheduler in
// features/reminders.js polls this table for due reminders.
const db = require('./db.js');

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

module.exports = {
  storeReminder,
  getDueReminders,
  markFired,
};
