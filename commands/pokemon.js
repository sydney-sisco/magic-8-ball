const pokemonFn = require('../functions/pokemon.js');

module.exports = [
  {
    ...pokemonFn[0],
    execute: async (message, args, context) => {
      await pokemonCommand(message);
    },
  },
];

const POKEMON_PREFIX = '!p';
const didYouMean = require('didyoumean');
const pokemonNames = require('../data/pokemon-list-en.js');
const { EmbedBuilder } = require('discord.js');

const pokemonCommand = async (message) => {
  var pokemon = message.content.substring(POKEMON_PREFIX.length + 1);

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
  
  pokemonFn[0].execute({pokemon: pokemon})
  .then(res => {
    console.log(res);
    if (res) {
      const embed = new EmbedBuilder()
      .setColor('#0099ff')
      .setTitle(`#${res.id} **${res.name}**`)
      .setDescription(`${res.genera}
      Type: ${res.types.join(', ')}`)
      .setImage(res.sprite)

      message.reply({ embeds: [embed] } );
    } else {
      const potentialMatch = didYouMean(pokemon, pokemonNames);

      if (!potentialMatch) {
        message.reply(`Pokémon ${pokemon} not found`);
        return;
      }

      message.reply(`Did you mean ${potentialMatch}?`);
    }
  })
  .catch(err => { 
    console.log(err);
    message.reply(`${err}`);
  });
};
