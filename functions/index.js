// Description: This file is the entry point for all the functions
// should be in a format that can be passed directly to gpt for 
// function execution

const reddit = require('./reddit.js');
const restart = require('./restart.js');

const functionsToLoad = [
  ...restart,
  ...reddit,
];

function loadFunctions() {

  return functionsToLoad;
}

module.exports = {
  loadFunctions,
};
