require('dotenv').config()
var preferences = require('./userPreferences');

const WolframAlphaAPI = require('wolfram-alpha-api');
const waApi = WolframAlphaAPI(process.env.WOLFRAM_APPID);

const wolframGetShort = function(message) {
  const queryString = message.content.substring(3);

  const userPreferences = preferences.getPreference(`${message.author.username}#${message.author.discriminator}`);
  console.log('got:', userPreferences);

  const result = waApi.getShort(  {
    i: queryString,
    units: userPreferences.units,
  });

  return result;
};

module.exports = {
  wolframGetShort
};
