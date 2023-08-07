module.exports = [
  {
    name: 'dalle',
    prefix: '!i',
    description: 'Create an image from text',
    execute: async (message, commands, args) => {
      const response = await dalle(message);
      message.reply(response);
    },
  },
]


var axios = require('axios');
const { EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const { getOptions } = require('../util/shared-helpers.js');

const DALLE_PREFIX = '!i';

const dalle = async (message) => {
  const member = message.member.id;
  const userPromptWithOptions = message.content.slice(DALLE_PREFIX.length).trim();
  const [userPrompt, options] = getOptions(userPromptWithOptions);

  return await createImage(userPrompt, member, message);
};

const createImage = async (userPrompt, member, message) => {

  message.react('1️⃣');

  if (userPrompt.length > 256) {
    return `Prompt must be less than 256 characters. Yours was ${userPrompt.length} characters.`;
  }

  try {
    const response = await openai.createImage({
      prompt: userPrompt,
      n: 1,
      size: "512x512",
      user: member,
    });
    console.log('response: ', response);
    const image_url = response.data.data[0].url;

    message.react('2️⃣');

    if (response.status !== 200) {
      console.log(response.statusText, response.data);
      message.react('❌');
      return 'API Error';
    }

    // invoke function to save image to cloud storage
    const hostedImageUrl = await invokeSaveFunction(image_url, userPrompt, member);

    message.react('3️⃣');

    const imageEmbed = new EmbedBuilder()
      .setTitle(`DALL·E Image: ${userPrompt}`)
      .setImage(hostedImageUrl)
      .setColor('#0099ff')
      .setTimestamp();

    message.react('✅');

    return { embeds: [imageEmbed] };

  } catch (error) {
    if (error.response) {
      console.log('error status: ', error.response.status);
      console.log('error data: ', error.response.data);
      message.react('❌');
      return `API Error: ${error.response.status}: ${error.response.data.error.message}`;
    } else {
      console.log('error message: ', error.message);
      message.react('❌');
      return `API Error: ${error.message}`;
    }
  }
}

const invokeSaveFunction = async (url, prompt, member) => {
  const options = {
    url,
    prompt,
    member,
  };

  try {
    const response = await axios.post(`${process.env.DO_FUNCTION_URL}`, options);
    console.log('response: ', response);
    return response.data.url;
  } catch (e) {
    console.error(e);
    return `Error saving image: ${e.message}`;
  }
}
