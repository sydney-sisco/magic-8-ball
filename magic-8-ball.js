require('dotenv').config()
const fs = require('node:fs');
const path = require('node:path');

const { Client, Collection, Events, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandsPath, file);
  const command = require(filePath);
  // Set a new item in the Collection with the key as the command name and the value as the exported module
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
  }
}

client.on(Events.InteractionCreate, async interaction => {
  if (!interaction.isChatInputCommand()) return;
  console.log(interaction);
  const command = interaction.client.commands.get(interaction.commandName);

  if (!command) {
    console.error(`No command matching ${interaction.commandName} was found.`);
    return;
  }

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
  }
});

const didYouMean = require('didyoumean');
const pokemonNames = require('./data/pokemon-list-en.js');

// var shortUrl = require('node-url-shortener');

const PREFIX = '!8';

const wolfram = require('./features/wolfram');
const WOLFRAM_PREFIX = '!7';

const moon = require('./features/sunCalc');
const MOON_PREFIX = '!moon';

const weather = require('./features/weather');
const WEATHER_PREFIX = '!weather';

const Pokemon = require('pokemon.js');
const POKEMON_PREFIX = '!p';

const {GPT3_PREFIX, gpt3} = require('./features/gpt3');

// const {log} = require('./features/logging');

// const {setReminder, getReminders} = require('./features/reminders');
// const { getPreference } = require('./features/userPreferences');
// const REMINDER_PREFIX = '!r';

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

  // getReminders(client);
});

client.on('messageCreate', async message => {
  // ignore messages sent by bots
  if (message.author.bot) {
    return;
  }

  // collect anonymous metadata about the message
  // log(message);


  // if(message.content.startsWith(REMINDER_PREFIX)) {
  //   setReminder(message);
  // }

  if (message.content.startsWith(GPT3_PREFIX)) {

    const result = await gpt3(message);

    if (!result) {
      return;
    }

    message.reply(result);
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

  if (message.content.startsWith(MOON_PREFIX)) {
    const moonData = moon.getMoonPhase(message);

    message.reply(moonData);
  }

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
