//
//// Command line interface
//

const readline = require('readline');
const restart = require('../commands/restart.js');

module.exports = function commandLineInterface(client) {

  const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
  });

  rl.on('line', (input) => {
      console.log(`Received: ${input}`);
      if (input === "exit") {
          rl.close();
      }

      if (input.startsWith('/say')) {
        const say = input.substring(5);
        const channel = client.channels.cache.get(process.env.ADMIN_CHANNEL_ID);

        channel.send(`[Admin]: ${say}`);
      }

      if (input.startsWith('/restart')) {
        restart[0].execute(null, null, {client, rl});
      }
  });

  rl.on('close', () => {
      console.log('Exiting command line interface...');
      process.exit(0);
  });
};
