module.exports = [
  {
    name: 'source',
    prefix: '!source',
    execute: async (message, args) => {
      const source = `https://github.com/sydney-sisco/magic-8-ball`
      message.reply(source);
    },
  },
];
