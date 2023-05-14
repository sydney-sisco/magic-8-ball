const sunCalc = require('./sunCalc.js');
// const weather = require('./weather.js');


// commands here will be loaded
const commandsToLoad = [
  sunCalc,
  // weather,
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
