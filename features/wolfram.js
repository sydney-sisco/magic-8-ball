require('dotenv').config()

const WolframAlphaAPI = require('wolfram-alpha-api');
const waApi = WolframAlphaAPI(process.env.WOLFRAM_APPID);

// waApi.getShort("weather South Bend Indiana")
// .then(console.log)
// .catch(console.error);


const wolframGetShort = function(queryString) {
  const result = waApi.getShort(  {
    i: queryString,
    units: 'nonmetric',
  });

  return result;
};

module.exports = {
  wolframGetShort
};
