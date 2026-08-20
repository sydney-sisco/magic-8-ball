// Reminder tools — let the LLM set, list, and cancel reminders from natural
// language. Time parsing uses chrono-node (e.g. "in 1 hour", "on friday",
// "tomorrow at 3pm"); day-only times default to 9:00 AM.
const { storeReminder, parseWhen, listPendingReminders, getRecentReminders, cancelReminder } = require('../util/reminders.js');

// --- reminder: set ---
const setReminderExecute = async (args, context) => {
  const { message } = context;
  const remindAt = parseWhen(args.when);

  if (remindAt.getTime() <= Date.now()) {
    return `"${args.when}" is in the past. Please pick a future time for the reminder.`;
  }

  const reminder = storeReminder({
    userId: message.author.id,
    channelId: message.channelId,
    text: args.text,
    remindAt,
  });

  return `Reminder #${reminder.id} set for ${remindAt.toLocaleString()}: "${args.text}"`;
};

// --- reminder: list ---
const formatReminder = (r) => ({
  id: r.id,
  text: r.text,
  remind_at: new Date(r.remind_at).toLocaleString(),
});

const listRemindersExecute = async (args, context) => {
  const { message } = context;
  const userId = message.author.id;
  const pending = listPendingReminders(userId);

  const result = { pending: pending.map(formatReminder) };

  // recent activity (last 24h) so the model doesn't guess about past reminders
  // from conversation memory — it can answer "what happened to reminder X?"
  // accurately instead of inferring.
  const recent = getRecentReminders(userId);
  const delivered = recent.filter((r) => r.status === 'fired').map(formatReminder);
  const cancelled = recent.filter((r) => r.status === 'cancelled').map(formatReminder);
  if (delivered.length) result.recently_delivered = delivered;
  if (cancelled.length) result.recently_cancelled = cancelled;

  return result;
};

// --- reminder: cancel (by id or natural language description) ---
const NOISE_WORDS = ['cancel', 'remind', 'reminder', 'the', 'a', 'an', 'about', 'my', 'me', 'of', 'please'];
const normalize = (s) => s.toLowerCase().replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').trim();
const stripNoise = (s) => normalize(s).split(' ').filter((w) => !NOISE_WORDS.includes(w)).join(' ');

const cancelReminderExecute = async (args, context) => {
  const { message } = context;
  const userId = message.author.id;
  const query = String(args.reminder || '').trim();
  const reminders = listPendingReminders(userId);

  if (!reminders.length) {
    return 'You have no pending reminders to cancel.';
  }

  // numeric -> cancel by id
  if (/^\d+$/.test(query)) {
    const cancelled = cancelReminder(Number(query), userId);
    return cancelled
      ? `Cancelled reminder #${cancelled.id}: "${cancelled.text}"`
      : `Could not find a pending reminder with id ${query}.`;
  }

  // text -> fuzzy match against the reminder text
  const q = stripNoise(query);
  if (!q) {
    return 'Please describe the reminder to cancel, e.g. "cancel the laundry reminder", or use an id.';
  }

  const matches = reminders.filter((r) => {
    const t = normalize(r.text);
    return t.includes(q) || q.includes(t);
  });

  if (matches.length === 1) {
    const cancelled = cancelReminder(matches[0].id, userId);
    return `Cancelled reminder #${cancelled.id}: "${cancelled.text}"`;
  }

  if (matches.length > 1) {
    const list = matches.map((r) => `#${r.id} "${r.text}"`).join(', ');
    return `Found ${matches.length} matching reminders: ${list}. Please be more specific, or use an id like "cancel reminder 12".`;
  }

  // no match — the model can relay this and the user can rephrase
  return `No pending reminder matching "${query}". Check \`!reminders\` to see your reminders.`;
};

module.exports = [
  {
    name: 'reminder',
    prefix: '!reminder',
    description: 'Set a reminder for the user. Call this whenever the user asks to be reminded about something at a future time, e.g. "remind me about the laundry in 1 hour" or "remind me about the party on friday".',
    parameters: {
      type: 'object',
      properties: {
        text: {
          type: 'string',
          description: 'What the user wants to be reminded about, e.g. "the laundry" or "the party"',
        },
        when: {
          type: 'string',
          description: 'When to remind them, in natural language, e.g. "in 1 hour", "in 30 minutes", "tomorrow at 3pm", "on friday"',
        },
      },
      required: ['text', 'when'],
    },
    execute: setReminderExecute,
  },
  {
    name: 'list_reminders',
    prefix: '!listreminders',
    description: 'List the reminders for the user. Call this when the user asks what reminders they have, e.g. "what reminders do I have?" or "show my reminders". The result has a "pending" array (reminders still to come — report this for "what reminders do I have?") plus optional "recently_delivered" and "recently_cancelled" arrays from the last 24 hours, provided as context; mention those only if relevant or if the user asks about a past reminder.',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: listRemindersExecute,
  },
  {
    name: 'cancel_reminder',
    prefix: '!cancelreminder',
    description: 'Cancel one of the user\'s pending reminders. Call this when the user asks to cancel, remove, or delete a reminder. The reminder argument should be the reminder id (a number) or a short description of it, e.g. "12" or "the laundry".',
    parameters: {
      type: 'object',
      properties: {
        reminder: {
          type: 'string',
          description: 'The id (number) or a short description of the reminder to cancel, e.g. "12" or "the laundry"',
        },
      },
      required: ['reminder'],
    },
    execute: cancelReminderExecute,
  },
];
