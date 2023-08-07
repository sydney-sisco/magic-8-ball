module.exports = [
  {
    name: 'chat',
    prefix: '!!',
    execute: async (message, args) => {
      chat(message);
    },
  },
]

const { gpt3 } = require('../features/gpt3');


const chat = (message) => {
  message.channel.sendTyping()
  const intervalId = setInterval(() => { message.channel.sendTyping() }, 5000);

  // Wrap the gpt3(message) call inside a Promise
  new Promise(async (resolve) => {
    const result = await gpt3(message);
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
}
