module.exports = [
  {
    name: 'chat',
    prefix: '!!',
    description: 'Chat with the bot',
    execute: async (message, args, context) => {
      chat(message, args, context);
    },
  },
]

const { gpt3 } = require('../features/gpt3');
const speech = require('../commands/text-to-speech.js');


const chat = (message, args, context) => {
  message.channel.sendTyping()
  const intervalId = setInterval(() => { message.channel.sendTyping() }, 5000);

  // Wrap the gpt3(message) call inside a Promise
  new Promise(async (resolve) => {
    const result = await gpt3(message, args, context);
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
          // response.react('❤️');
          // response.react('👎');
        });
        return;
      }

      const response = await message.reply(result);

      if (message.channel.id === '715424064512065539') {
        const message_with_robot_text = message;
        message_with_robot_text.content = '!say' + result;
        speech[0].execute(message_with_robot_text);
      }
      // response.react('❤️');
      // response.react('👎');
    })
    .finally(() => {
      // Clear the interval after processing the response
      clearInterval(intervalId);
    });
}
