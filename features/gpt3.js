var fs = require('fs');
var axios = require('axios');
const CONTEXT_LENGTH = process.env.OPENAI_CONTEXT_LENGTH || 1000;
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'text-ada-001';

const { EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const download = require('image-downloader');

const { getOptions } = require('../util/shared-helpers.js');

const GPT3_PREFIX = '!!';

const humanIdentifier = `\nHuman: `;
const aiIdentifier = '\nAI: ';
const context = [];
const cannedPrompt = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n${humanIdentifier}Hello, who are you?${aiIdentifier}I am an AI created by OpenAI. How can I help you today?`;

const gpt3 = async (message) => {
  const member = message.member.id;
  const userPromptWithOptions = message.content.slice(GPT3_PREFIX.length).trim();
  const [userPrompt, options] = getOptions(userPromptWithOptions);

  if (options.includes('i')) {
    return await createImage(userPrompt, member, message);
  }

  if (options.includes('v')) {
    return await createVariation(userPrompt, member, message);
  }

  manageContext(userPrompt);

  let response;
  try {
    response = await openai.createCompletion({
      model: TEXT_MODEL,
      prompt: `${cannedPrompt}${context}${aiIdentifier}`,
      temperature: 0.9,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
      stop: [" Human:", " AI:"],
      user: member,
    });

    if (!response) {
      return 'API Error';
    }

    console.log('response: ', response);

    if (response.status !== 200) {
      console.log(response.statusText, response.data);
      return 'API Error';
    }

    const gptMessage = response.data.choices[0].text.trim();
    console.log('gptMessage:', gptMessage);
    context.push(`${aiIdentifier}${gptMessage}`);
    return `${gptMessage}`;
  } catch (error) {
    if (error.response) {
      console.log('error status: ', error.response.status);
      console.log('error data: ', error.response.data);
      return `API Error: ${error.response.status}: ${error.response.data.error.message}`;
    } else {
      console.log('error message: ', error.message);
      return `API Error: ${error.message}`;
    }
  }

}

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

const createVariation = async (filename, member, message) => {

  console.log('directory:', process.cwd());

  try {
    const response = await openai.createImageVariation(
      fs.createReadStream(`${process.cwd() }/images/${filename}.png`),
      1,
      "1024x1024",
      "url",
      member,
    );
  
    image_url = response.data.data[0].url;

    // invoke function to save image to cloud storage
    const hostedImageUrl = await invokeSaveFunction(image_url, `${filename}-variation`, member);

    message.react('3️⃣');
  
    const imageEmbed = new EmbedBuilder()
      .setTitle(`DALL·E Image: ${filename}-variation`)
      .setImage(hostedImageUrl)
      .setColor('#0099ff')
      .setTimestamp();
  
    return { embeds: [imageEmbed] };
  } catch (error) {
    if (error.response) {
      console.log('error status: ', error.response.status);
      console.log('error data: ', error.response.data);
      return `API Error: ${error.response.status}: ${error.response.data.error.message}`;
    } else {
      console.log('error message: ', error.message);
      return `API Error: ${error.message}`;
    }
  }
};

const manageContext = userPrompt => {
  context.push(`${humanIdentifier}${userPrompt}`);
  manageContextLength(userPrompt);
}

const manageContextLength = userPrompt => {
  // check total length of context
  const totalLength = context.reduce((acc, cur) => acc + cur.length, 0);

  if (totalLength > CONTEXT_LENGTH) {
    // remove oldest context
    context.shift();
    
    // recursively check again
    return manageContextLength(userPrompt);
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

module.exports = {
  GPT3_PREFIX,
  gpt3
};
