module.exports = [
  {
    name: 'weather',
    prefix: '!weather',
    description: 'Get the current weather for a location',
    execute: async (message, args, context) => {
      const response = await getWeather(message);
      message.reply(response);
    },
  },
];

const { getWeatherForCity } = require('../util/weather.js');

const WEATHER_PREFIX = '!weather';

const getWeather = message => {
  const location = message.content.slice(WEATHER_PREFIX.length + 1).trim(); // 9 is the length of '!weather '
  return getWeatherForCity(location);
};
