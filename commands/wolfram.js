module.exports = [
  {
    name: 'wolfram',
    description: 'wolfram alpha query (getShort)',
    prefix: '!7',
    execute: async (message, args) => {
      const result = await wolframGetShort(message);
      message.reply(result);
    },
  },
  // {
  //   name: 'wolframfull',
  //   description: 'wolfram alpha query (getFull)',
  //   prefix: '!wolframfull',
  //   execute: async (message, args) => {
  //     const result = await wolframGetFull(message);
  //     message.reply(result);
  //   },
  // },
]

require('dotenv').config()
var preferences = require('../features/userPreferences');

const WolframAlphaAPI = require('../util/WolframAlphaAPI.js');
const waApi = WolframAlphaAPI(process.env.WOLFRAM_APPID);

const addLinkToResult = queryString => { 
  return `https://www.wolframalpha.com/input/?i=${queryString}`;
}

const wolframGetShort = async function(message) {
  const queryString = message.content.substring(13);

  const userPreferences = preferences.getPreference(`${message.author.username}#${message.author.discriminator}`);
  // console.log('got:', userPreferences);

  let result;
  try {
    result = await waApi.getShort(  {
      i: queryString,
      units: userPreferences.units,
    });
  } catch (error) {
    console.error(`Error fetching Wolfram Alpha query: ${error.message}`);
    result = `Error fetching Wolfram Alpha query: ${error.message}`;
  } finally {
    return result;
  }
};

const wolframGetFull = async function (message) {
  const queryString = message.content.substring(13);

  const userPreferences = preferences.getPreference(`${message.author.username}#${message.author.discriminator}`);
  // console.log('got:', userPreferences);

  let result;
  try {
    result = await waApi.getFull({
      i: queryString,
      units: userPreferences.units,
    })

  } catch (error) {
    console.error(`Error fetching Wolfram Alpha query: ${error.message}`);
    result = `Error fetching Wolfram Alpha query: ${error.message}`;
  } finally {
    return result;
  }
};
