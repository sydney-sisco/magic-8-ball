module.exports = [
  {
    name: 'weather',
    prefix: '!weather',
    execute: async (message, args) => {
      const response = await getWeather(message);
      message.reply(response);
    },
  },
];

var weather = require('openweather-apis');
weather.setAPPID(process.env.OPEN_WEATHER_MAP);
weather.setLang('en');
// 'metric'  'internal'  'imperial'
weather.setUnits('metric');

const getWeatherData = location => {
  weather.setCity(location);

  return new Promise((resolve, reject) => {
    weather.getSmartJSON((err, smart) => {
      console.log('weather data:', smart);
      
      if(err) reject(err);

      if(!smart) {
        reject(`Weather data for ${location} not found`);
        return;
      }
  
      resolve(smart);
    });
  });
}

const getWeather = message => {
  const location = message.content.slice(9); // export const WEATHER_PREFIX = '!weather '; and 9 is the length of '!weather '
  weather.setCity(location);

  return new Promise((resolve, reject) => {
    weather.getSmartJSON((err, smart) => {
      console.log('weather data:', smart);
      
      if(err) reject(err);

      if(!smart) {
        reject(`Weather data for ${location} not found`);
        return;
      }
  
      resolve(`weather data for ${location}:
      > temp: ${smart.temp.toFixed(0)}°C
      > description: ${smart.description} ${getWeatherEmoji(smart.weathercode)}
      > humidity ${smart.humidity}%`);
    });
  });
}

const getWeatherEmoji = weatherCode => {

  let weatherEmoji = weatherEmojis[weatherCode];

  // console.log('weatherEmojis[weatherCode]', weatherEmojis[weatherCode], weatherCode);

  return  weatherEmoji ? weatherEmoji : '';
}

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
}
