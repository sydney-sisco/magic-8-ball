require('dotenv').config()

const Discord = require("discord.js");
const client = new Discord.Client();

// not finished or implemented
const commands = {
  scry: {
    prefix: '!8',
    desc: 'Seek advice about your future. Usage: "!8 `<your cosmic query>`"'
  },
  computationalIntelligence: {
    prefix: '!7',
    desc: 'Harness the power of computational intelligence "!7 `<query>`"'
  },
  moonPhase: {
    prefix: '!moon',
    desc: 'Show moon phase'
  }
}

const PREFIX = '!8';

const wolfram = require('./features/wolfram');
const WOLFRAM_PREFIX = '!7';

const moon = require('./features/sunCalc');
const MOON_PREFIX = '!moon';

const weather = require('./features/weather');
const WEATHER_PREFIX = '!weather';

const divinations = [
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'Yes – definitely.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.',
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  'Don\'t count on it.',
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.'
];

const scry = () => {
  return divinations[Math.floor(Math.random() * divinations.length)];
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);
});

client.on('message', message => {
  
  // ignore messages sent by bots
  if (message.author.bot) {
    return;
  }

  if (message.content.startsWith(WEATHER_PREFIX)) {
    const weatherData = weather.getWeather(message)
    .then(data => message.reply(data))
    .catch(err => console.log('err:', err));
  }

  if (message.content.startsWith(MOON_PREFIX)) {
    const moonData = moon.getMoonPhase(message);

    message.reply(moonData);
  }

  if (message.content.startsWith(WOLFRAM_PREFIX)) {
    console.log('message:', message);
    wolfram.wolframGetShort(message)
    .then(res => message.reply(res))
    .catch(err => {
      message.reply(err.toString())
    })
    .catch(err => console.log('what?',err))
    return;
  }

  if (message.content.startsWith(PREFIX)) {
    message.reply(`🎱 ${scry()} 🎱`);
    return;
  }

});

client.login(process.env.DISCORD_BOT_TOKEN);
