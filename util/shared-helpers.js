
// getOptions parses message for bash-like options and their values
const getOptions = message => {
  const options = message.split(' ').filter(word => word.startsWith('-'));
  return [trim(message), options.map(option => option.slice(1))];
}

// trim removes options from message
const trim = message => {
  return message.split(' -').shift();
}

module.exports = {
  getOptions
};
