# Magic 8-Ball Bot

Magic 8-Ball Bot is a Discord bot that you can use to seek advice about your future.

![easy peasy](https://github.com/sydney-sisco/magic-8-ball/blob/main/docs/scry.png?raw=true)

You can read more about this bot [here](https://sydney-sisco.medium.com/build-and-host-your-first-discord-bot-using-node-js-and-aws-20607585b6e3).

## Additional Features

This bot can do more than just see the future! The current list of features includes:
- Computational Intelligence (via [Wolfram Alpha](https://www.wolframalpha.com))
- Moon phase
- Weather (via [Open Weather API](https://openweathermap.org/api))
- Pokédex lookup (via [PokéAPI](https://pokeapi.co))
- Slackbot-style scheduled reminders

![can snakes jump?](https://github.com/sydney-sisco/magic-8-ball/blob/main/docs/snek.png?raw=true)
![features](https://github.com/sydney-sisco/magic-8-ball/blob/main/docs/features.png?raw=true)

### Development

`npm run debug`

`gcloud config configurations activate magic-8-ball`
`gcloud auth application-default login`

List of all API voices [here](https://cloud.google.com/text-to-speech/docs/voices).

#### Serverless Functions

To run:
`cd functions`
`cd <function name>`
`npm run start`


### Testing

We now have test! To run them, use

`npm run test`

### What does it take to get this thing running?

create .env at root of repo

copy the contents from password manager

copy gcp.json from password manager

# thigns to look at:
https://products.wolframalpha.com/llm-api/documentation

fnctins:
https://platform.openai.com/docs/api-reference/chat/create#chat/create-functions
https://platform.openai.com/docs/guides/gpt/function-calling
https://github.com/openai/openai-cookbook/blob/main/examples/How_to_call_functions_for_knowledge_retrieval.ipynb