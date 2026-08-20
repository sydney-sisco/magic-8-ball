// Shared weather logic, used by both the !weather command and the weather
// tool (function calling) exposed to the LLM.

var weather = require('openweather-apis');
weather.setAPPID(process.env.OPEN_WEATHER_MAP);
weather.setLang('en');
// 'metric'  'internal'  'imperial'
weather.setUnits('imperial');

const getWeatherForCity = (city) => {
  weather.setCity(city);

  return new Promise((resolve, reject) => {
    weather.getSmartJSON((err, smart) => {
      console.log('weather data:', smart);

      if (err) reject(err);

      if (!smart) {
        reject(`Weather data for ${city} not found`);
        return;
      }

      resolve(`weather data for ${city}:
      > temp: ${smart.temp.toFixed(0)}°F
      > description: ${smart.description} ${getWeatherEmoji(smart.weathercode)}
      > humidity ${smart.humidity}%`);
    });
  });
};

const getWeatherEmoji = (weatherCode) => {
  const weatherEmoji = weatherEmojis[weatherCode];
  return weatherEmoji ? weatherEmoji : '';
};

const weatherEmojis = {
  200: '🌩️',
  201: '⛈️',
  202: '⛈️',
  210: '🌩️',
  211: '🌩️',
  212: '⛈️',
  221: '🌩️',
  230: '⛈️',
  231: '⛈️',
  232: '⛈️',
  300: '🌧️',
  301: '🌧️',
  302: '🌧️',
  310: '🌧️',
  311: '🌧️',
  312: '🌧️',
  313: '🌧️',
  314: '🌧️',
  321: '🌧️',
  500: '🌦️',
  501: '🌦️',
  502: '🌦️',
  503: '🌦️',
  504: '🌦️',
  511: '🌨️',
  520: '🌧️',
  521: '🌧️',
  522: '🌧️',
  531: '🌧️',
  600: '❄️',
  601: '❄️',
  602: '❄️',
  611: '❄️',
  612: '❄️',
  613: '❄️',
  615: '❄️',
  616: '❄️',
  620: '❄️',
  621: '❄️',
  622: '❄️',
  701: '🌫️',
  711: '🌫️',
  721: '🌫️',
  731: '🌫️',
  741: '🌫️',
  751: '🌫️',
  761: '🌫️',
  762: '🌋',
  771: '🌬️',
  781: '🌪',
  800: '☀️',
  801: '🌤️',
  802: '⛅',
  803: '🌥️',
  804: '☁️',
};

module.exports = {
  getWeatherForCity,
};
