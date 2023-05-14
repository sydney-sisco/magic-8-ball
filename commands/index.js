const sunCalc = require('./sunCalc.js');
const source = require('./source.js');
const say = require('./say.js');

// commands here will be loaded
const commandsToLoad = [
  sunCalc,
  source,
  say,
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
