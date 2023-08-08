module.exports = [
  {
    name: 'restart',
    // prefix: '!restart',
    description: 'Restart the bot and download the latest updates',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (fnargs, args, context) => {
      const { client, rl, message } = context;
      await restart(message, client, rl);
    },
  },
]

const restart = async (message, client, rl) => {

  const restartMessage = '[System]: Restarting...';

  if (message) {
    await message.reply(restartMessage);
  } else {

    const channel = client.channels.cache.get(process.env.ADMIN_CHANNEL_ID);
    await channel.send(restartMessage);
  }

  console.log('Restarting bot...');
  rl.close();
  await client.destroy();
};
