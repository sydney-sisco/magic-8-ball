var fs = require('fs');
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'text-ada-001';

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const { getOptions } = require('../util/shared-helpers.js');
const { dangerouslyExecuteJS } = require('../util/dangerously-execute-code.js');

const GPT3_PREFIX = '!!';

const { wolframGetShort } = require('../features/wolfram.js');

const ConversationContext = require('../util/contextManager.js');

const plugins = {
  wolfram: {
    name: 'wolfram',
    description: 'Use wolfram alpha to get the best answers possible',
    usage: 'wolfram',
    examples: ['wolfram("current weather in New York")','wolfram("how many golf balls would fit inside the earth?")'],
    function: async (query) => {
      const response = await wolframGetShort({ content: `!7 ${query}`, author: { username: '', discriminator: ''} });
      return response;
    }
  }
};


const systemMessages = [
  {
    role: 'default',
    shortName: 'default',
    systemMessage: 
      {
        role: 'system',
        content: `You are a helpful Discord bot written in NodeJS v16. Please try to answer as concisely as possible. Your messages must be fewer than 2000 characters.`,
      },
    hints: [

    ],
  },

      {
      name: 'code-writing-bot',
      shortName: 'code',
      systemMessage: {  
        role: 'system',
        content: `You are a code writing bot. 
        You write NodeJS 16 code.
        You will be given a question and must write code that will assist in acquiring an answer.
        Please return the code enclosed in double brackets <<like this>>.
        Do not add comments. 
        Do not add commentary.`
        // Your code runs in the following environment.         
// const functions = require('@google-cloud/functions-framework');
// const axios = require('axios');
// const cheerio = require('cheerio');
// const _ = require('lodash');
// const math = require('mathjs');
// const moment = require('moment');
// const natural = require('natural');
// const fetch = require('node-fetch');
// functions.http('helloHttp', async (req, res) => {
//   // get the code to execute
//   const code = req.body.code;
//   try {
//     // execute the code
//     let output = eval(code);
//     // Check if the output is a Promise and wait for it to resolve
//     if (output instanceof Promise) {
//       output = await output;
//     }
//     // send the response
//     res.send({ result: output });
//   } catch (error) {
//     console.error(\`Error executing code: \${ error.message }\`);
//     res.status(500).send({ error: error.message });
//   }
// });
// `
    },
      hints: [
        { role: 'user', content: 'top post on reddit about cats' },
        { role: 'assistant', content: `
  <<const findHighestCatPost = async () => {
  const response = await axios.get('https://www.reddit.com/.json');
  const catPosts = response.data.data.children.filter(post => post.data.title.toLowerCase().includes('cat'));
  const highestCatPost = catPosts.reduce((highest, post) => post.data.ups > highest.data.ups ? post : highest);
  return highestCatPost.data.permalink;}findHighestCatPost();>>` },
  ],
  },
];

// const systemMessage = 
//   {
//     role: 'system',
//     content: `You are a helpful assistant written in NodeJS. Answer as concisely as possible. You have access to the following plugins: ${Object.keys(plugins).map(key => `${plugins[key].name}: ${plugins[key].description}`).join(', ')}. To use a plugin, enclose the plugin function and its query in double curly braces. For example, {{wolfram("current weather in New York")}}.`
//   }
// ;

const hints = [
  // { role: 'user', content: 'Hello, who are you?' },
  // { role: 'assistant', content: 'I am your AI-powered chatbot assistant. How can I help you today?' },
  { role: 'user', content: 'top post on reddit about cats' },
  { role: 'assistant', content: `<<const findHighestCatPost = async () => {const response = await axios.get('https://www.reddit.com/.json');const catPosts = response.data.data.children.filter(post => post.data.title.toLowerCase().includes('cat'));const highestCatPost = catPosts.reduce((highest, post) => post.data.ups > highest.data.ups ? post : highest);return highestCatPost.data.permalink;}findHighestCatPost();>>`}
  // { role: 'user', content: 'Please reverse the following string: "Hello World!"' },
  // { role: 'assistant', content: `{{"Hello, World!".split('').reverse().join('');}}` },
  // { role: 'user', content: `Please sum this array: [1, 2, 3, 4, 5]` },
  // { role: 'assistant', content: `{{[1, 2, 3, 4, 5].reduce((a, b) => a + b, 0)}}` },
  // { role: 'user', content: `What's on the front page of reddit right now?` },
  // { role: 'assistant', content: `{{const { get } = require('axios'); get('https://www.reddit.com/.json').then(res => res.data.data.children[0].data.title)}}` },
  // { role: 'user', content: `what's the current price of gas in seattle?` },
  // { role: 'assistant', content: `{{const { get } = require('axios'); get('https://www.gasbuddy.com/home?search=Seattle&fuel=1').then(res => {const regex = /(\$[\d]+\.[\d]+)/; const matched = res.data.match(regex); return matched[0];})}}` },
  // { role: 'user', content: 'I would like to know the weather in New York.' },
  // { role: 'assistant', content: '{{wolfram("current weather in New York")}}' },
  // { role: 'user', content: 'The weather in New York City, United States, currently includes no precipitation with clear skies, a wind speed of 4 meters per second and a temperature of 13 degrees Celsius'},
  // { role: 'assistant', content: 'The weather in New York City, United States, currently includes no precipitation with clear skies, a wind speed of 4 meters per second and a temperature of 13 degrees Celsius'},
  // { role: 'user', content: 'how many golf balls would fit inside the earth?'},
  // { role: 'assistant', content: '{{wolfram("how many golf balls would fit inside the earth?")}}'},
  // { role: 'user', content: '1.5 times 10 to the 25 to 1.7 times 10 to the 25'},
  // { role: 'assistant', content: 'The number of golf balls that would fit inside the Earth lies somewhere between 15 and 17 septillion.'},
];

const gpt3 = async (message) => {
  const member = message.member;
  const memberId = member.id;

  const userPromptWithOptions = message.content.slice(GPT3_PREFIX.length).trim();

  // userPrompt is the string that the user typed, ready to be processed
  const [userPrompt, options] = getOptions(userPromptWithOptions);

  let conversation;
  if (options.includes('c')) {
    const context = systemMessages.find(sm => sm.shortName === 'code')
    conversation = await ConversationContext.getNoContext(context.systemMessage, context.hints);
  }
  else {
    const context = systemMessages.find(sm => sm.shortName === 'default')
    conversation = await ConversationContext.getConversation(message.channelId, context.systemMessage, context.hints);
  }

  // add the user's message to the conversation
  conversation.addMessage('user', userPrompt, message);

  console.log('sending: ', conversation.getContext());

  let response;
  try {
    response = await openai.createChatCompletion({
      model: TEXT_MODEL,
      messages: conversation.getContext(), // maybe pass in channel id here?
      // temperature: 0.9,
      // max_tokens: 150,
      // top_p: 1,
      // frequency_penalty: 0,
      // presence_penalty: 0.6,
      user: memberId,
    });

    if (!response) {
      return 'API Error';
    }

    console.log('response: ', response);

    if (response.status !== 200) {
      console.log(response.statusText, response.data);
      return 'API Error';
    }

    let gptMessage = response.data.choices[0].message.content.trim();
    console.log('gptMessage:', gptMessage);
    // messages.push({ role: 'assistant', content: gptMessage });

    // if first two characters are << and last two characters are >>, then we have code to execute
    if (gptMessage.slice(0, 2) === '<<' && gptMessage.slice(-2) === '>>') {
      const code_to_execute = gptMessage.slice(2, -2);

      console.log('Code to execute:', code_to_execute);

      const result = await dangerouslyExecuteJS(code_to_execute);
      gptMessage = await gpt3({ ...message, member: {id: memberId, ...member}, content: `${GPT3_PREFIX} Below is the result of the code execution. Please use it to formulate a response to the user:\n${result}` });
    }


    // check for plugin usage
    // const regex = /\{\{(\w+)\(\"(.*?)\"\)\}\}/;
    // const match = regex.exec(gptMessage);

    // if (match !== null) {
    //   const pluginName = match[1];
    //   console.log('Plugin name:', pluginName);
    //   const pluginQuery = match[2];
    //   console.log('Plugin query:', pluginQuery);

    //   // check if plugin exists
    //   if (plugins[match[1]]) {
    //     const plugin = plugins[match[1]];
    //     console.log('Plugin found:', plugin.name);
    //     const pluginResponse = await plugin.function(pluginQuery);
    //     console.log('Plugin response:', pluginResponse);
    //     // messages.push({ role: 'assistant', content: pluginResponse });
    //     // return `${gptMessage}`;
    //     gptMessage = await gpt3({...message, member: message.member, content: `${GPT3_PREFIX} Below is the response from the plugin. Please use it to formulate a response to the user:\n${pluginResponse}`} );
    //   }
    // } else {
    //   console.log('No plugin found in the input text.');
    // }

    // add the AI's message to the conversation
    conversation.addMessage('assistant', gptMessage, message);

    // if gptMessage is longer than 2000 characters, split it into multiple messages, each less than 2000 characters
    if (gptMessage.length > 2000) {
      const splitMessages = gptMessage.match(/(.|[\r\n]){1,2000}/g);
      return splitMessages;
    }
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

// const createImage = async (userPrompt, member, message) => {

//   message.react('1️⃣');

//   if (userPrompt.length > 256) {
//     return `Prompt must be less than 256 characters. Yours was ${userPrompt.length} characters.`;
//   }

//   try {
//     const response = await openai.createImage({
//       prompt: userPrompt,
//       n: 1,
//       size: "512x512",
//       user: member,
//     });
//     console.log('response: ', response);
//     const image_url = response.data.data[0].url;

//     message.react('2️⃣');

//     if (response.status !== 200) {
//       console.log(response.statusText, response.data);
//       message.react('❌');
//       return 'API Error';
//     }

//     // invoke function to save image to cloud storage
//     const hostedImageUrl = await invokeSaveFunction(image_url, userPrompt, member);

//     message.react('3️⃣');

//     const imageEmbed = new EmbedBuilder()
//       .setTitle(`DALL·E Image: ${userPrompt}`)
//       .setImage(hostedImageUrl)
//       .setColor('#0099ff')
//       .setTimestamp();

//     message.react('✅');

//     return { embeds: [imageEmbed] };

//   } catch (error) {
//     if (error.response) {
//       console.log('error status: ', error.response.status);
//       console.log('error data: ', error.response.data);
//       message.react('❌');
//       return `API Error: ${error.response.status}: ${error.response.data.error.message}`;
//     } else {
//       console.log('error message: ', error.message);
//       message.react('❌');
//       return `API Error: ${error.message}`;
//     }
//   }
// }

// const createVariation = async (filename, member, message) => {

//   console.log('directory:', process.cwd());

//   try {
//     const response = await openai.createImageVariation(
//       fs.createReadStream(`${process.cwd() }/images/${filename}.png`),
//       1,
//       "1024x1024",
//       "url",
//       member,
//     );
  
//     image_url = response.data.data[0].url;

//     // invoke function to save image to cloud storage
//     const hostedImageUrl = await invokeSaveFunction(image_url, `${filename}-variation`, member);

//     message.react('3️⃣');
  
//     const imageEmbed = new EmbedBuilder()
//       .setTitle(`DALL·E Image: ${filename}-variation`)
//       .setImage(hostedImageUrl)
//       .setColor('#0099ff')
//       .setTimestamp();
  
//     return { embeds: [imageEmbed] };
//   } catch (error) {
//     if (error.response) {
//       console.log('error status: ', error.response.status);
//       console.log('error data: ', error.response.data);
//       return `API Error: ${error.response.status}: ${error.response.data.error.message}`;
//     } else {
//       console.log('error message: ', error.message);
//       return `API Error: ${error.message}`;
//     }
//   }
// };

// const manageContext = (messages, userPrompt) => {
//   messages.push({ role: 'user', content: userPrompt });
//   manageContextLength(messages, userPrompt);
// }

// const manageContextLength = (messages, userPrompt) => {
//   // check total length of context
//   const totalLength = messages.reduce((acc, cur) => acc + cur.content.length, 0);

//   if (totalLength > CONTEXT_LENGTH) {
//     // remove oldest context
//     messages.shift();
    
//     // recursively check again
//     return manageContextLength(messages, userPrompt);
//   }
// }

// const invokeSaveFunction = async (url, prompt, member) => {
//   const options = {
//     url,
//     prompt,
//     member,
//   };

//   try {
//     const response = await axios.post(`${process.env.DO_FUNCTION_URL}`, options);
//     console.log('response: ', response);
//     return response.data.url;
//   } catch (e) {
//     console.error(e);
//     return `Error saving image: ${e.message}`;
//   }
// }

module.exports = {
  GPT3_PREFIX,
  gpt3
};
