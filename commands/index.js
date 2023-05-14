const sunCalc = require('./sunCalc.js');
const source = require('./source.js');

// commands here will be loaded
const commandsToLoad = [
  sunCalc,
  source,
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
