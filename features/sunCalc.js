const SunCalc = require('suncalc');

const getMoonPhase = message => {
  const moonData = SunCalc.getMoonIllumination(new Date());
  console.log('moonData:', moonData);

  let phaseName = '';
  let phaseEmoji = '';

  const phase = moonData.phase.toFixed(2);

  if (phase == 0.00) {
    phaseName = 'New Moon';
    phaseEmoji = '🌑';
  } else if (phase < 0.25) {
    phaseName = 'Waxing Crescent';
    phaseEmoji = '🌒'
  } else if (phase == 0.25) {
    phaseName = 'First Quarter';
    phaseEmoji = '🌓';
  } else if (phase < 0.5) {
    phaseName =  'Waxing Gibbous';
    phaseEmoji = '🌔';
  } else if (phase == 0.5) {
    phaseName = 'Full Moon';
    phaseEmoji = '🌕';
  } else if (phase < 0.75) {
    phaseName = 'Waning Gibbous';
    phaseEmoji = '🌖'
  } else if (phase == 0.75) {
    phaseName = 'Last Quarter';
    phaseEmoji = '🌗';
  } else {
    phaseName = 'Waning Crescent';
    phaseEmoji = '🌘';
  }

  let fraction = (moonData.fraction * 100).toFixed(0);

  return `${phaseName} (${fraction}%) ${phaseEmoji}`;
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