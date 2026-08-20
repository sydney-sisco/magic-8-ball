// Reminder tool — lets the LLM set reminders from natural language.
// The `when` argument is parsed with chrono-node (e.g. "in 1 hour",
// "on friday", "tomorrow at 3pm"). Day-only times default to 9:00 AM.
const chrono = require('chrono-node');
const { storeReminder } = require('../util/reminders.js');

const DEFAULT_REMINDER_HOUR = 9; // when a day is given without a time

// parses a natural language time into a future Date
const parseWhen = (when) => {
  const results = chrono.parse(when, new Date(), { forwardDate: true });

  if (!results.length) {
    throw new Error(`Could not understand when "${when}". Try something like "in 1 hour", "in 30 minutes", "tomorrow at 3pm", or "on friday".`);
  }

  const start = results[0].start;
  const remindAt = start.date();

  // if no explicit time was given (e.g. just "on friday"), default to 9:00 AM
  if (!('hour' in start.knownValues)) {
    remindAt.setHours(DEFAULT_REMINDER_HOUR, 0, 0, 0);
  }

  return remindAt;
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
    execute: async (args, context) => {
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
    },
  },
];
