
// getOptions parses message for bash-like options and their values
const getOptions = message => {
  const options = message.split(' ').filter(word => word.startsWith('-'));
  return [trim(message), options.map(option => option.slice(1))];
}

// trim removes options from message
const trim = message => {
  return message.split(' -').shift();
}

function parseCommandOptions(argsString) {
  if (!argsString || argsString.trim() === '') {
    return {};
  }

  const args = argsString.match(/(".*?"|[^"\s]+)+(?=\s*|\s*$)/g).map(arg => arg.replace(/"/g, ''));
  const options = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('-')) {
      const isDoubleHyphen = args[i].startsWith('--');
      const optionName = isDoubleHyphen ? args[i].substr(2) : args[i].substr(1);
      if (i + 1 < args.length && !args[i + 1].startsWith('-')) {
        options[optionName] = args[i + 1];
        i++;
      } else {
        options[optionName] = true;
      }
    }
  }

  return options;
}

module.exports = {
  getOptions,
  parseCommandOptions,
};
