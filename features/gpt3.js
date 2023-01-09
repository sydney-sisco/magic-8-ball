const { EmbedBuilder } = require('discord.js');
const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const { getOptions } = require('../util/shared-helpers.js');

const GPT3_PREFIX = '!!';

const humanIdentifier = `\nHuman: `;
const aiIdentifier = '\nAI: ';
const context = [];
const cannedPrompt = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n${humanIdentifier}Hello, who are you?${aiIdentifier}I am an AI created by OpenAI. How can I help you today?`;

const gpt3 = async (message) => {
  const userPromptWithOptions = message.content.slice(GPT3_PREFIX.length).trim();
  const [userPrompt, options] = getOptions(userPromptWithOptions);

  if (options.includes('i')) {

    if (userPrompt.length > 256) {
      message.reply(`Prompt must be less than 256 characters. Yours was ${userPrompt.length} characters.`);
      return;
    }

    let response;
    let image_url;
    try {
      response = await openai.createImage({
        prompt: userPrompt,
        n: 1,
        size: "512x512",
      });
      console.log(response);
      image_url = response.data.data[0].url;
    } catch (error) {
      console.log('error: ', error);
      return 'API Error';
    }

    if (!response) {
      return 'API Error';
    }

    console.log('response: ', response);

    if (response.status !== 200) {
      console.log(response.statusText, response.data);
      return 'API Error';
    }

    const imageEmbed = new EmbedBuilder()
      .setTitle(`DALL·E Image: ${userPrompt}`)
      .setImage(image_url)
      .setColor('#0099ff')
      .setTimestamp();

    message.reply({ embeds: [imageEmbed] });
    return;
  }

  manageContext(userPrompt);

  let response;
  try {
    response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${cannedPrompt}${context}${aiIdentifier}`,
      temperature: 0.9,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
      stop: [" Human:", " AI:"],
    });
  } catch (error) {
    console.log('error:', error);
    return 'API Error';
  }

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
}

const manageContext = userPrompt => {
  if (context.length > 10) {
    context.shift();
  }
  
  context.push(`${humanIdentifier}${userPrompt}`);
}



module.exports = {
  GPT3_PREFIX,
  gpt3
};
