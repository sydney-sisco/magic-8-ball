module.exports = [
  {
    name: 'dalle',
    prefix: '!i',
    description: 'Create an image from text',
    execute: async (message, args, context) => {
      const response = await dalle(message);
      message.reply(response);
    },
  },
]


const { EmbedBuilder } = require('discord.js');
const OpenAI = require("openai");
const IMAGE_QUALITY = process.env.OPENAI_IMAGE_QUALITY || 'standard';
const { saveImage } = require('../util/digitalOceanSpaces.js');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});
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

  try {
    const response = await openai.images.generate({
      model:"dall-e-3",
      prompt: userPrompt,
      n: 1,
      size: "1024x1024",
      user: member,
      quality: IMAGE_QUALITY,
    });
    console.log('response: ', response);
    const image_url = response.data[0].url;

    message.react('2️⃣');

    // invoke function to save image to cloud storage
    const hostedImageUrl = await saveImage(image_url, userPrompt, member);

    message.react('3️⃣');

    const imageEmbed = new EmbedBuilder()
      .setTitle(`DALL·E Image: ${userPrompt.substring(0,100)}`)
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
