module.exports = [
  {
    name: 'pokemon',
    prefix: '!p',
    description: 'Get information about a pokemon',
    parameters: {
      type: 'object',
      properties: {
        pokemon: {
          type: 'string',
          description: 'The name of the pokemon to get information about',
        },
      },
    },
    execute: async (args, context) => {
      const pokemonName = args.pokemon;
      return await pokemon(pokemonName);
    },
  },
];

const Pokemon = require('pokemon.js');

const pokemon = async (pokemon) => {
  Pokemon.setLanguage('english');

  const pokemonFound = await Pokemon.getPokemon(pokemon);

  if (!pokemonFound) {
    return { 
      error: `Pokemon ${pokemon} not found`,
    };
  }

  const dataToReturn = {
    name: pokemonFound.name,
    genera: pokemonFound.genera,
    id: pokemonFound.id,
    types: pokemonFound.types.map(type => type.name),
    sprite: pokemonFound.sprites.front_default,
  };
  
  return {
    pokemon: dataToReturn
  };
};
