const SunCalc = require('suncalc');

const getMoonPhase = message => {
  const moonData = SunCalc.getMoonIllumination(new Date());

  let verbose = false;
  if (message.content === '!moon -v') verbose = true;

  let phaseName = '';
  let phaseEmoji = '';

  const phase = Math.round(moonData.phase * 100) / 100;

  if (phase === 0.0) {
    phaseName = 'New Moon';
    phaseEmoji = '🌑';
  } else if (phase < 0.25) {
    phaseName = 'Waxing Crescent';
    phaseEmoji = '🌒'
  } else if (phase === 0.25) {
    phaseName = 'First Quarter';
    phaseEmoji = '🌓';
  } else if (phase < 0.5) {
    phaseName =  'Waxing Gibbous';
    phaseEmoji = '🌔';
  } else if (phase === 0.5) {
    phaseName = 'Full Moon';
    phaseEmoji = '🌕';
  } else if (phase < 0.75) {
    phaseName = 'Waning Gibbous';
    phaseEmoji = '🌖'
  } else if (phase === 0.75) {
    phaseName = 'Last Quarter';
    phaseEmoji = '🌗';
  } else {
    phaseName = 'Waning Crescent';
    phaseEmoji = '🌘';
  }

  let fraction = (moonData.fraction * 100).toFixed(0);

  return `${phaseName} (${fraction}%) ${phaseEmoji}\nNext full moon: ${findNextFullMoon()}${verbose ? `\n> phase (0 - 1): ${moonData.phase.toFixed(4)}\n> illuminated fraction: ${(moonData.fraction * 100).toFixed(2)}%` : ''}`;
}


// search for the date of the next full moon in incrememnts of 6 hours
const findNextFullMoon = () => {

  // get the current moon phase
  let date = new Date();
  let phase = Math.round(SunCalc.getMoonIllumination(date).phase * 100) / 100;

  // if the current phase is not a full moon, increment the date by 6 hours and check again
  while (phase !== 0.50) {
    date = new Date(date.getTime() + 6 * 60 * 60 * 1000);
    phase = Math.round(SunCalc.getMoonIllumination(date).phase * 100) / 100;
  }

  return date.toString().substring(0, 10);
}

module.exports = {
  getMoonPhase
};

// 🌒 Waxing Crescent Moon
// 🌓 First Quarter Moon
// 🌔 Waxing Gibbous Moon
// 🌕 Full Moon
// 🌖 Waning Gibbous Moon
// 🌗 Last Quarter Moon
// 🌘 Waning Crescent Moon
// 🌑 New Moon

// 🌝 Full Moon Face
// 🌚 New Moon Face
// 🌛 First Quarter Moon Face
// 🌜 Last Quarter Moon Face

// 🌙 Crescent Moon
