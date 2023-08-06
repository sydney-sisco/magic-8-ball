require('dotenv').config()

// const Discord = require("discord.js");
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

// const client = new Discord.Client();
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

const didYouMean = require('didyoumean');
const pokemonNames = require('./data/pokemon-list-en.js');

const PREFIX = '!8';

const wolfram = require('./features/wolfram');
const WOLFRAM_PREFIX = '!7';

const weather = require('./features/weather');
const WEATHER_PREFIX = '!weather';

const Pokemon = require('pokemon.js');
const POKEMON_PREFIX = '!p';

const {GPT3_PREFIX, gpt3} = require('./features/gpt3');

const {VOICE_PREFIX, voice} = require('./features/voice');

const {DUMP_PREFIX, dump} = require('./features/dump.js');

const {DALLE_PREFIX, dalle} = require('./features/dalle.js');

const { loadCommands } = require('./commands/index.js');
const commands = loadCommands();


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

  const channel = client.channels.cache.get(process.env.ADMIN_CHANNEL_ID);
  channel.send(`[System]: Online: ${client.user.tag}`);
});

client.on('messageCreate', async message => {
  // ignore messages sent by bots
  if (message.author.bot) {
    return;
  }

  // load commands from commands/index.js
  const matchedCommand = [
    ...commands.values()
  ].find((command) => message.content.startsWith(command.prefix));

  if (matchedCommand) {
    const args = message.content.slice(matchedCommand.prefix.length).trim().split(/ +/);
    matchedCommand.execute(message, args);
  }

  if(message.content.startsWith('!restart')) {
    
    restart(message);
  }

  if (message.content.startsWith(DALLE_PREFIX)) {
    message.reply(await dalle(message));
  }

  if (message.content.startsWith(DUMP_PREFIX)) {
    dump(message);
    return;
  }

  if (message.content.startsWith(VOICE_PREFIX)) {
    voice(message);
  }

  if (message.content.startsWith(GPT3_PREFIX)) {

    message.channel.sendTyping()
    const intervalId = setInterval(() => { message.channel.sendTyping() }, 5000);

    // Wrap the gpt3(message) call inside a Promise
    new Promise(async (resolve) => {
      const result = await gpt3(message, restart, weather.getWeatherData);
      resolve(result);
    })
      .then(async (result) => {
        if (!result) {
          return;
        }

        // If result is an array, send each item as a separate message
        if (Array.isArray(result)) {
          result.forEach(async (item) => {
            const response = await message.reply(item);
            response.react('❤️');
            response.react('👎');
          });
          return;
        }

        const response = await message.reply(result);
        response.react('❤️');
        response.react('👎');
      })
      .finally(() => {
        // Clear the interval after processing the response
        clearInterval(intervalId);
      });
  }

  if (message.content.startsWith(POKEMON_PREFIX)) {
    var pokemon = message.content.substring(POKEMON_PREFIX.length + 1);
    Pokemon.setLanguage('english');


    if (pokemon.toLowerCase() === 'missingno') {
      const missingNoEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('#̶͍̭͇̈̋͊͊̓͘͝͝?̵̢̛̦̱͍̳̯͍̲̺̟̘͗͑̈́̈́̃͋͋́̾̿̓͛̈́̿̕͘͠͝͠͝?̵̢̤͎͈͖͚͖̪͍̗͈̂̑͗́̊̍̆͂̚̕̚͝?̷̨̢̩̻̗̫̱̦͉̹̞̱̟͕̳͓͓̹̫͓͂̀̀̐͊̄̀̋͒̆͒̏̈́̀̉̒̐̓̈́͆͝ͅḾ̸̢̭̼̟͇͉̲̦̦́i̸̧̡̢̨͖̜̩̠̦̹͉͈̺͜͜͝s̴͓̰͛̋̎͊̆̎̊̽͑̋͌͌͘s̵̤̞̩̺̠̹̪̠̀̋́͆̈͋͊́͋͋͘̚i̷̝̣̱̒̏̈́̾͛̃̍̆̈͐̈́͐͆̕͝n̶̼̭͎̘̫̙̲̂̋͑ḡ̷̢͖͇͕̯̖͓͋͑̾̎͌̐͂̋̂̚̚͜N̴̦̖͙̪̭̪͌̃̈͛͋̐̐̋̅̓̍̐̚͠ǫ̷̲͉͔̘̮̼͎͉͓͇̙̪̈́̃ͅ.̶̢̡͎͙̼̪̠̦͔̰̖͖͓̙̲̋̌̃͋')
      .setDescription('??? Pokémon\nType: b̴̧̡̘͇͚̣̆̓̈́̂̍̈͝ͅḯ̴͎̓r̶̫̹͎̳͑̓̐̈́̈́̂d̴̹͚̈́̂̋̾,̸̝̩̮̫͙̩̋̉ ̵̞̒̂̓̀̅̕͝ͅn̶̢̘̼̻͊̓o̵̡̨̰̳̻̩͇̫̲̒͛̏̽̍̊́r̶͕̬̮̰̯̗̭̳̟̽͂̓̈̎m̵̗̳̘͎̈́̊͛̅̇ậ̴̙̬̤̀́̃́̕l̸̤̮̾̈̀̃̒̎̂͝')
      .setImage('https://i.imgur.com/qOjN3AO.gif')

      const notFoundEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('#?? **Error!**')
      .setDescription('Pokémon not found\nType: N/A')
      .setImage('https://i.imgur.com/OsdTZnR.png')

      const pikachuEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('#25 **Pikachu**')
      .setDescription('Mouse Pokémon/nType: electric')
      .setImage('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png')

      const charizardEmbed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle('#6 **Charizard**')
      .setDescription('Flame Pokémon\nType: fire, flying')
      .setImage('https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/6.png')

      const msg = await message.reply( missingNoEmbed );

      setTimeout(() => {
        msg.edit(charizardEmbed);

        setTimeout(() => {
          msg.edit(missingNoEmbed);
          
          setTimeout(() => {
            msg.edit(notFoundEmbed);
          }, 2222);
        }, 1111);
      }, 3333);

      return;
    }
    
    Pokemon.getPokemon(pokemon)
    .then(res => {
      if (res) {
        const stats = Object.keys(res.stats);
  
        const embed = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle(`#${res.id} **${res.name}**`)
        .setDescription(`${res.genera}
        Type: ${res.types.map(type => type.name).join(', ')}`)
        .setImage(res.sprites.front_default)
  
        message.reply({ embeds: [embed] } );
      } else {
        const potentialMatch = didYouMean(pokemon, pokemonNames);

        if (!potentialMatch) {
          return;
        }

        message.reply(`Did you mean ${potentialMatch}?`);
      }
    })
    .catch(err => { 
      console.log(err);
      message.reply(`${err}`);
    }
    );
  }

  if (message.content.startsWith(WEATHER_PREFIX)) {
    const weatherData = weather.getWeather(message)
    .then(data => message.reply(data))
    .catch(err => message.reply(err.toString()));
  }

  // if (message.content.startsWith(MOON_PREFIX)) {
  //   const moonData = moon.getMoonPhase(message);

  //   message.reply(moonData);
  // }

  if (message.content.startsWith(WOLFRAM_PREFIX)) {
    wolfram.wolframGetShort(message)
    .then(res => {
      // console.log('res:', res);

      // const url = `https://www.wolframalpha.com/input/?i=${encodeURI(message.content.substring(3))}`;
      
      // shortUrl.short(url, function(err, url){
      //   console.log(url);
      //   message.reply(`${res}\nSee more: ${url}`)
      // });
      message.reply(res)
    })
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

//
//// Command line interface
//

const readline = require('readline');

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

rl.on('line', (input) => {
    console.log(`Received: ${input}`);
    if (input === "exit") {
        rl.close();
    }

    if (input.startsWith('/say')) {
      const say = input.substring(5);
      const channel = client.channels.cache.get(process.env.ADMIN_CHANNEL_ID);

      channel.send(`[Admin]: ${say}`);
    }

    if (input.startsWith('/restart')) {
      restart();
    }
});

rl.on('close', () => {
    console.log('Exiting command line interface...');
    process.exit(0);
});

const restart = async (message) => {

  const restartMessage = '[System]: Restarting...';

  if (message) {
    await message.reply(restartMessage);
  } else {

    const channel = client.channels.cache.get(process.env.ADMIN_CHANNEL_ID);
    await channel.send(restartMessage);
  }

  console.log('Restarting bot...');
  rl.close();
  client.destroy();
};
