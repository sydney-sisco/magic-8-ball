module.exports = [
  {
    name: 'chat',
    prefix: '!chat',
    execute: async (message, args) => {
      chat(message);
    },
  },
];

const eventEmitter = require('../eventEmitter.js');
const { GPT3_PREFIX, gpt3 } = require('../features/gpt3.js');

const chat = async (message) => {
  message.channel.sendTyping()
  const intervalId = setInterval(() => { message.channel.sendTyping() }, 5000);

  // Wrap the gpt3(message) call inside a Promise
  new Promise(async (resolve) => {
    const result = await generateResponse(message);
    resolve(result);
  })
    .then(async (result) => {
      if (!result) {
        return;
      }

      // If result is an array, send each item as a separate message
      if (Array.isArray(result)) {
        result.forEach(async (item) => {
          const response = await message.reply(item);
          response.react('❤️');
          response.react('👎');
        });
        return;
      }

      const response = await message.reply(result);
      response.react('❤️');
      response.react('👎');
    })
    .finally(() => {
      // Clear the interval after processing the response
      clearInterval(intervalId);
    });
};

const generateResponse = async (message) => {
  const response = await gpt3(message);
  eventEmitter.emit('response-generated', { message, response });
  return Promise.resolve(response);
};
