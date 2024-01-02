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


const help = require('./help.js');
const source = require('./source.js');
const dump = require('./dump.js');
const restart = require('./restart.js');
const sunCalc = require('./sunCalc.js');
const weather = require('./weather.js');
const pokemon = require('./pokemon.js');
const reddit = require('./reddit.js');
const wolfram = require('./wolfram.js');
const say = require('./text-to-speech.js');
const dalle = require('./dalle.js');
const chat = require('./chat.js');
const checkReddit = require('./check_reddit.js');

// commands here will be loaded
const commandsToLoad = [
  help,
  source,
  dump,
  restart,
  sunCalc,
  weather,
  pokemon,
  reddit,
  wolfram,
  say,
  dalle,
  chat,
  checkReddit,
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
