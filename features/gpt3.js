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
];

const functions = [
  {
    name: 'restart',
    description: 'Restart the robot',
    parameters: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'getWeather',
    description: 'Get the weather',
    parameters: {
      type: 'object',
      properties: {
        location: {
          type: 'string',
        },
      },
    },
  },
];

const gpt3 = async (message, restartCB, getWeatherData) => {
  const member = message.member;
  const memberId = member.id;

  const userPromptWithOptions = message.content.slice(GPT3_PREFIX.length).trim();

  // userPrompt is the string that the user typed, ready to be processed
  const [userPrompt, options] = getOptions(userPromptWithOptions);

  let conversation;
  if (options.includes('c')) {
    const context = systemMessages.find(sm => sm.shortName === 'code')
    conversation = await ConversationContext.getNoContext(context.systemMessage.content, context.hints);
  } else {
    conversation = await ConversationContext.getConversation(message.channelId);
  }

  // check userPrompt for commands
  if (userPrompt.startsWith('!set')) {
    const customSystemMessage = userPrompt.slice('!set'.length).trim();
    conversation.setSystemMessage(customSystemMessage);
    return 'System message set for channel.';
  } else if (userPrompt.startsWith('!reset')) {
    conversation.resetSystemMessage();
    return 'System message reset for channel.';
  } else if (userPrompt.startsWith('!show')) {
    return `System message: ${conversation.getSystemMessage()}`;
  } else if (userPrompt.startsWith('!forget')) {
    conversation.setContextTimestamp();
    return 'Conversation context has been cleared.';
  } else if (userPrompt.startsWith('!remember')) {
    conversation.clearContextTimestamp();
    return 'Conversation context has been remembered.';
  } else if (userPrompt.startsWith('!help')) {
    return 'Commands: !set <system message>, !reset, !show, !forget, !remember, !help';
  }

  // add the user's message to the conversation
  conversation.addMessage('user', userPrompt, message);

  console.log('sending: ', conversation.getContext());

  let response;
  try {
    response = await openai.createChatCompletion({
      model: TEXT_MODEL,
      messages: conversation.getContext(), // maybe pass in channel id here?
      functions: functions,
      // temperature: 0.9,
      // max_tokens: 150,
      // top_p: 1,
      // frequency_penalty: 0,
      // presence_penalty: 0.6,
      user: memberId,
    });

    if (!response) {
      return 'API Error, no response';
    }

    console.log('response: ', response);

    if (response.status !== 200) {
      console.log(response.statusText, response.data);
      return 'API Error';
    }

    // check if GPT wants to call a function
    if (response.data.choices[0].message.function_call) {
      const function_call = response.data.choices[0].message.function_call;
      const function_name = function_call.name;
      const function_arguments = function_call.arguments;

      console.log('function_call:', function_call);

      if (function_name === 'restart') {
        restartCB();
        return;
      } else if (function_name === 'getWeather') {
        // parse arguments as json
        const parsedArguments = JSON.parse(function_arguments);

        const location = parsedArguments.location;
        const weatherData = await getWeatherData(location);
        
        console.log('weatherData:', weatherData);

        // add the weather data to the context and get a new response
        conversation.addMessage('function', JSON.stringify(weatherData), message, 'getWeather');
        response = await openai.createChatCompletion({
          model: TEXT_MODEL,
          messages: conversation.getContext(),
          functions: functions,
          user: memberId,
        });

        if (!response) {
          return 'API Error, no response';
        }

        console.log('response: ', response);

        if (response.status !== 200) {
          console.log(response.statusText, response.data);
          return 'API Error';
        }


      }

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

module.exports = {
  GPT3_PREFIX,
  gpt3,
  openai, // for testing (is this really how you do it?)
};
