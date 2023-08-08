const restart = require('../functions/restart.js');

module.exports = [
  {
    ...restart[0],
    execute: async (message, args, context) => {
      const { client, rl } = context;
      restartCommand(message, client, rl);
    },
  },
]

const restartCommand = async (message, client, rl) => {
  restart[0].execute(null, {message, client, rl});
};
