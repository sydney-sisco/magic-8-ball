module.exports = [
  {
    name: 'source',
    prefix: '!source',
    description: 'Get a link to the source code for this bot',
    execute: async (message, args, context) => {
      const source = `https://github.com/sydney-sisco/magic-8-ball`
      message.reply(source);
    },
  },
];
