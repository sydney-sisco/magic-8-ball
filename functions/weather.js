const { getWeatherForCity } = require('../util/weather.js');

module.exports = [
  {
    name: 'weather',
    prefix: '!weather',
    description: 'Get the current weather for a city or location',
    parameters: {
      type: 'object',
      properties: {
        city: {
          type: 'string',
          description: 'The city or location to get the weather for, e.g. "Tokyo" or "New York"',
        },
      },
      required: ['city'],
    },
    execute: async (args, context) => {
      return await getWeatherForCity(args.city);
    },
  },
];
