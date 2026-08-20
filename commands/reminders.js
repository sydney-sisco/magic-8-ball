// Direct reminder commands — set / list / cancel reminders without going
// through the chatbot. Shares storage and time parsing with the LLM `reminder`
// tool (util/reminders.js), so both paths write to the same table.
const { parseReminderText, storeReminder, listPendingReminders, cancelReminder } = require('../util/reminders.js');

const REMINDME_PREFIX = '!remindme';

const formatReminderList = (reminders) => {
  if (!reminders.length) {
    return 'You have no pending reminders.';
  }

  const lines = reminders.map((r, i) => {
    const when = new Date(r.remind_at).toLocaleString();
    return `${i + 1}. \`#${r.id}\` — ${r.text} — ${when}`;
  });

  return `Your pending reminders:\n${lines.join('\n')}`;
};

module.exports = [
  {
    name: 'remindme',
    prefix: REMINDME_PREFIX,
    description: 'Set a reminder, e.g. "!remindme take out the trash in 1 hour"',
    execute: async (message, args, context) => {
      const input = message.content.slice(REMINDME_PREFIX.length).trim();

      let response;
      try {
        const { text, remindAt } = parseReminderText(input);
        const reminder = storeReminder({
          userId: message.author.id,
          channelId: message.channelId,
          text,
          remindAt,
        });
        response = `⏰ Reminder #${reminder.id} set for ${remindAt.toLocaleString()}: "${text}"`;
      } catch (error) {
        response = error.message;
      }
      message.reply(response);
    },
  },
  {
    name: 'reminders',
    prefix: '!reminders',
    description: 'List your pending reminders',
    execute: async (message, args, context) => {
      const reminders = listPendingReminders(message.author.id);
      message.reply(formatReminderList(reminders));
    },
  },
  {
    name: 'cancelreminder',
    prefix: '!cancelreminder',
    description: 'Cancel a reminder, e.g. "!cancelreminder 12"',
    execute: async (message, args, context) => {
      const id = args[0];
      if (!id || !/^\d+$/.test(id)) {
        message.reply('Usage: `!cancelreminder <id>` — find the id with `!reminders`');
        return;
      }

      const cancelled = cancelReminder(Number(id), message.author.id);
      message.reply(cancelled
        ? `Reminder #${id} cancelled.`
        : `Could not cancel reminder #${id} — make sure it exists and is yours (check \`!reminders\`).`);
    },
  },
];
