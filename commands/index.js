// Description: This file is used to load all the commands in the commands folder.
// commands should export an array of objects with the following properties:

// {
//   name: 'command name',
//   description: 'command description',
//   prefix: '!commandPrefix',
//   execute: (message, args) => {
//     // command logic here
//   },
// }


const sunCalc = require('./sunCalc.js');
const source = require('./source.js');
const dump = require('./dump.js');

// commands here will be loaded
const commandsToLoad = [
  sunCalc,
  source,
  dump,
];

function loadCommands() {
  const commands = new Map();

  for (const commandCollection of commandsToLoad) {

    for (const command of Array.isArray(commandCollection) ? commandCollection : [commandCollection]) {
      commands.set(command.name, command);
    }
  }

  return commands;
}

module.exports = {
  loadCommands,
};
