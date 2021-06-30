var weather = require('openweather-apis');
weather.setAPPID(process.env.OPEN_WEATHER_MAP);
// console.log('API KEY:', process.env.OPEN_WEATHER_MAP);
weather.setLang('en');
// 'metric'  'internal'  'imperial'
weather.setUnits('metric');

const getWeather = message => {
  const location = message.content.slice(9);
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
      > description: ${smart.description}
      > humidity ${smart.humidity}%`);
    });
  });
}

module.exports = {
  getWeather
};
