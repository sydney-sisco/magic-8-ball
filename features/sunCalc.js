const SunCalc = require('suncalc');

const getMoonPhase = message => {
  const moonData = SunCalc.getMoonIllumination(new Date());
  console.log('moonData:', moonData);

  let phaseName = '';
  let phaseEmoji = '';

  if (moonData.phase < 0.25) {
    phaseName = 'Waxing Crescent';
    phaseEmoji = '🌒'
  } else if (moonData.phase < 0.5) {
    phaseName =  'Waxing Gibbous';
    phaseEmoji = '🌔';
  } else if (moonData.phase < 0.75) {
    phaseName = 'Waning Gibbous';
    phaseEmoji = '🌖'
  } else {
    phaseName = 'Waning Crescent';
    phaseEmoji = '🌘';
  }

  let fraction = (moonData.fraction * 100).toFixed(0);

  return `${phaseName} (${fraction}%)`;
}

module.exports = {
  getMoonPhase
};


// 🌓 First Quarter Moon
// 🌕 Full Moon
// 🌗 Last Quarter Moon
// 🌑 New Moon

// 🌝 Full Moon Face
// 🌚 New Moon Face