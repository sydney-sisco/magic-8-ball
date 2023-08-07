module.exports = [
  {
    name: 'pokemon',
    prefix: '!p',
    description: 'Get information about a pokemon',
    execute: async (message, commands, args) => {
      await pokemon(message);
    },
  },
];

const Pokemon = require('pokemon.js');
const POKEMON_PREFIX = '!p';
const didYouMean = require('didyoumean');
const pokemonNames = require('../data/pokemon-list-en.js');
const { EmbedBuilder } = require('discord.js');

const pokemon = async (message) => {
  var pokemon = message.content.substring(POKEMON_PREFIX.length + 1);
  Pokemon.setLanguage('english');

  // this used to work now it crashes. Since missingno is a glitch anyway, I'm going to leave it.
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
};
