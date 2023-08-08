var fs = require('fs');
const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'text-ada-001';

const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const { getOptions } = require('../util/shared-helpers.js');

const GPT3_PREFIX = '!!';

const ConversationContext = require('../util/contextManager.js');

const systemMessages = [
  {
    role: 'default',
    shortName: 'default',
    systemMessage: 
      {
        role: 'system',
        content: `You are a helpful Discord bot written in NodeJS v16. Please try to answer as concisely as possible. Your messages must be fewer than 2000 characters.`,
      },
    hints: [],
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
    },
    hints: [
      { role: 'user', content: 'top post on reddit about cats' },
      { role: 'assistant', content: `
        <<const findHighestCatPost = async () => {
        const response = await axios.get('https://www.reddit.com/.json');
        const catPosts = response.data.data.children.filter(post => post.data.title.toLowerCase().includes('cat'));
        const highestCatPost = catPosts.reduce((highest, post) => post.data.ups > highest.data.ups ? post : highest);
        return highestCatPost.data.permalink;}findHighestCatPost();>>`
      },
    ],
  },
];

const restart = require('../commands/restart.js');

// load functions
const { loadFunctions } = require('../functions/index.js');
const functions = loadFunctions();

const gpt3 = async (message, args, sysContext) => {
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
  commandResponse = handleCommands(userPrompt, conversation);
  if (commandResponse) {
    return commandResponse;
  }

  // add the user's message to the conversation
  conversation.addMessage('user', userPrompt, message);

  const functionsToSend = functions.length ? functions.map(({execute, ...rest}) => rest) : undefined

  console.log('sending context: ', conversation.getContext());
  console.log('sending functions: ', functionsToSend);

  let response;
  try {

    response = await createChatCompletion(conversation.getContext(), functionsToSend, memberId)

    if (!response) {
      return 'API Error, no response';
    }

    console.log('response: ', response.status, response.statusText, response.config.data, response.data);

    if (response.status !== 200) {
      console.log(response.statusText, response.data);
      return 'API Error';
    }

    // check if GPT wants to call a function
    while (response.data.choices[0].message.function_call) {
      const function_call = response.data.choices[0].message.function_call;
      const {function_name, functionResponse} = await handleFunctionCall(function_call, functions, {...sysContext, message});

      conversation.addMessage('function', functionResponse, message, function_name);

      // send results back to model
      response = await createChatCompletion(conversation.getContext(), functionsToSend, memberId)
      console.log('response status: ', response.status, 'statusText: ', response.statusText, 'config data: ',response.config.data, 'response.data: ', response.data);
    }
      
    let gptMessage = response.data.choices[0].message.content.trim();
    console.log('gptMessage:', gptMessage);


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

const handleCommands = (userPrompt, conversation) => {
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

  return false;
};

const createChatCompletion = async (messages, functions, memberId) => {

  let functionsToSend = functions;
  if (!functions || !functions.length) {
    functionsToSend = undefined;
  }
    
  return await openai.createChatCompletion({
    model: TEXT_MODEL,
    messages,
    functions: functionsToSend,
    // temperature: 0.9,
    // max_tokens: 150,
    // top_p: 1,
    // frequency_penalty: 0,
    // presence_penalty: 0.6,
    user: memberId,
  });
}

const handleFunctionCall = async (function_call, functions, context) => {
  
  console.log('function_call:', function_call);
  const function_name = function_call.name;
  const function_arguments = function_call.arguments;


  // match function name dynamically
  if (functions.find(f => f.name === function_name)) {
    const functionObject = functions.find(f => f.name === function_name);

    console.log('functionObject:', functionObject);
    let functionResponse = await functionObject.execute(function_arguments, context);
    
    console.log('functionResponse:', functionResponse);

    // if functionResponse is not a string, stringify it
    if (typeof functionResponse !== 'string') {
      functionResponse = JSON.stringify(functionResponse);
    }

    return { function_name, functionResponse };
  } 
}

module.exports = {
  GPT3_PREFIX,
  gpt3,
  openai, // for testing (is this really how you do it?)
};
