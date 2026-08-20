// Reminder scheduler — polls the reminders table and delivers due reminders.
// Started from magic-8-ball.js on 'ready'. Because reminders are stored in
// SQLite, anything that came due while the bot was offline fires on boot.
const { getDueReminders, markFired } = require('../util/reminders.js');

const REMINDER_TICK_MS = 30 * 1000; // check for due reminders every 30s

let clientRef = null;

const fireReminder = async (reminder) => {
  const { id, user_id, channel_id, text } = reminder;

  if (!clientRef) {
    // scheduler not initialized yet — leave it pending and retry next tick
    console.error(`[reminder] scheduler not initialized, skipping #${id}`);
    return;
  }

  const content = `<@${user_id}> ⏰ Reminder: ${text}`;

  try {
    // deliver in the channel where the reminder was set
    if (channel_id) {
      const channel = await clientRef.channels.fetch(channel_id);
      if (channel?.send) {
        await channel.send(content);
        markFired(id);
        console.log(`[reminder] fired #${id} in channel ${channel_id}`);
        return;
      }
    }

    // fallback: DM the user
    const user = await clientRef.users.fetch(user_id);
    await user.send(content);
    markFired(id);
    console.log(`[reminder] fired #${id} via DM`);
  } catch (error) {
    // mark fired anyway so we don't retry a broken delivery forever
    markFired(id);
    console.error(`[reminder] failed to deliver #${id}: ${error.message}`);
  }
};

const checkDueReminders = async () => {
  const due = getDueReminders();
  for (const reminder of due) {
    await fireReminder(reminder);
  }
};

const startReminderScheduler = (client) => {
  clientRef = client;
  setInterval(() => {
    checkDueReminders().catch((e) => console.error('[reminder] tick error:', e));
  }, REMINDER_TICK_MS);
  console.log('⏰ Reminder scheduler started');

  // fire anything that came due while the bot was offline
  checkDueReminders().catch((e) => console.error('[reminder] initial check error:', e));
};

module.exports = {
  startReminderScheduler,
  checkDueReminders,
};
