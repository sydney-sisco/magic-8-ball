const SunCalc = require('suncalc');

const getMoonPhase = message => {
  const moonData = SunCalc.getMoonIllumination(new Date());

  const options = getOptions(message.content);

  let phaseName = '';
  let phaseEmoji = '';

  const phase = Math.round(moonData.phase * 100) / 100;

  const tolerance = 0.025;

  if (phase === 0.0) {
    phaseName = 'New Moon';
    phaseEmoji = '🌑';
  } else if (phase < 0.25) {
    phaseName = 'Waxing Crescent';
    phaseEmoji = '🌒';
  } else if (phase === 0.25) {
    phaseName = 'First Quarter';
    phaseEmoji = '🌓';
  } else if (phase < 0.5 - tolerance) {
    phaseName = 'Waxing Gibbous';
    phaseEmoji = '🌔';
  } else if (phase >= 0.5 - tolerance && phase <= 0.5 + tolerance) {
    phaseName = 'Full Moon';
    phaseEmoji = '🌕<:walf:1103900569145462886>';
  } else if (phase < 0.75) {
    phaseName = 'Waning Gibbous';
    phaseEmoji = '🌖';
  } else if (phase === 0.75) {
    phaseName = 'Last Quarter';
    phaseEmoji = '🌗';
  } else {
    phaseName = 'Waning Crescent';
    phaseEmoji = '🌘';
  }


  let fraction = (moonData.fraction * 100).toFixed(0);

  if (options.includes('f')) {
    return `Next full moon: ${findNextFullMoon()}`;
  }

  if (options.includes('n')) {
    return `Next new moon: ${findNextNewMoon()}`;
  }

  let response = `${phaseName} (${fraction}%) ${phaseEmoji}`;

  // add verbose output if requested
  if (options.includes('v')) {
    response += `\n> phase (0 - 1): ${moonData.phase.toFixed(4)}\n> illuminated fraction: ${(moonData.fraction * 100).toFixed(2)}%`;
  }

  return response;
}

const findNextFullMoon = () => {
  return findNextPhase(0.5);
}

const findNextNewMoon = () => {
  return findNextPhase(0.0);
}

// search for the date of the next full moon in incrememnts of 6 hours
const findNextPhase = phaseToFind => {
  // get the current moon phase
  let date = new Date();
  let phase = Math.round(SunCalc.getMoonIllumination(date).phase * 100) / 100;

  // if the current phase is not a full moon, increment the date by 6 hours and check again
  while (phase !== phaseToFind) {
    date = new Date(date.getTime() + 6 * 60 * 60 * 1000);
    phase = Math.round(SunCalc.getMoonIllumination(date).phase * 100) / 100;
  }

  // add 6 more hours to the date to get a more accurate result
  date = new Date(date.getTime() + 6 * 60 * 60 * 1000);

  return date.toString().substring(0, 10);
}

const getOptions = message => {
  return message.substring(6).split('');
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
