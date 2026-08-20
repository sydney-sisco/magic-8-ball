const TEXT_MODEL = process.env.OPENAI_TEXT_MODEL || 'text-ada-001';

const OpenAI = require("openai");

const openai = new OpenAI({
  baseURL: process.env.OPENAI_BASE_URL,
  apiKey: process.env.OPENAI_API_KEY,
});

const GPT3_PREFIX = '!!';

const ConversationContext = require('../util/contextManager.js');

// load functions
const { loadFunctions } = require('../functions/index.js');
const functions = loadFunctions();

// map the registered functions to the OpenAI/DeepSeek `tools` format
const tools = functions.map(({ execute, prefix, ...rest }) => ({
  type: 'function',
  function: rest,
}));

const gpt3 = async (message, args, sysContext) => {
  const member = message.member;
  const memberId = message.author.id;

  // userPrompt is the string that the user typed, ready to be processed
  const userPrompt = message.content.slice(GPT3_PREFIX.length).trim();
  conversation = await ConversationContext.getConversation(message.channelId);

  // check userPrompt for commands
  commandResponse = handleCommands(userPrompt, conversation);
  if (commandResponse) {
    return commandResponse;
  }

  // add the user's message to the conversation
  conversation.addMessage('user', userPrompt, message);

  const toolsToSend = tools.length ? tools : undefined;

  console.log('sending context: ', conversation.getContext());
  console.log('sending tools: ', toolsToSend);

  let response;
  try {

    const context = conversation.getContext();

    response = await createChatCompletion(context, toolsToSend, memberId)

    if (!response) {
      return 'API Error, no response';
    }

    console.log('response: ', response);

    // check if the model wants to call any tools
    let toolCallBudget = 5; // safety valve against infinite tool loops
    while (response.choices[0].message.tool_calls && toolCallBudget-- > 0) {
      // strip fields the API adds (like `index`) that shouldn't be echoed back
      const toolCalls = response.choices[0].message.tool_calls.map(({ index, ...rest }) => rest);

      // the assistant message announcing the tool calls must stay in the history
      conversation.addMessage('assistant', null, message, null, { toolCalls });

      for (const toolCall of toolCalls) {
        const { name, arguments: rawArguments } = toolCall.function;
        console.log('tool_call:', toolCall);

        message.reply(`[System]: Calling function: \`${name}\` with arguments:\n\`\`\`json\n${rawArguments}\`\`\``);

        const fn = functions.find(f => f.name === name);
        if (!fn) {
          conversation.addMessage('tool', `Error: unknown function \`${name}\``, message, null, { toolCallId: toolCall.id });
          continue;
        }

        let functionResponse;
        try {
          functionResponse = await fn.execute(JSON.parse(rawArguments || '{}'), { ...sysContext, message, member });
        } catch (error) {
          console.log('function error: ', error);
          functionResponse = typeof error === 'string' ? error : `Error: ${error.message}`;
        }

        // if functionResponse is not a string, stringify it
        if (typeof functionResponse !== 'string') {
          functionResponse = JSON.stringify(functionResponse);
        }

        conversation.addMessage('tool', functionResponse, message, null, { toolCallId: toolCall.id });
        message.reply(`[System]: Function \`${name}\` returned.`);
      }

      // send results back to model
      response = await createChatCompletion(conversation.getContext(), toolsToSend, memberId)
      console.log('response id: ', response.id, 'finish_reason: ', response.choices[0].finish_reason);
    }

    const gptMessage = response.choices[0].message.content?.trim();
    console.log('gptMessage:', gptMessage);

    if (!gptMessage) {
      return 'I hit the tool call limit without a final answer. Please try again.';
    }

    // add the AI's message to the conversation
    conversation.addMessage('assistant', gptMessage, message);

    // if gptMessage is longer than 2000 characters, split it into multiple messages, each less than 2000 characters
    if (gptMessage.length > 2000) {
      const splitMessages = gptMessage.match(/(.|[\r\n]){1,2000}/g);
      return splitMessages;
    }
    return `${gptMessage}`;
  } catch (error) {
    if (error.status) {
      // openai SDK v4 API errors
      console.log('error status: ', error.status);
      console.log('error data: ', error.error);
      return `API Error: ${error.status}: ${error.error?.message || error.message}`;
    }
    if (error.response) {
      // legacy axios-style errors
      console.log('error status: ', error.response.status);
      console.log('error data: ', error.response.data);
      return `API Error: ${error.response.status}: ${error.response.data?.error?.message || error.response.statusText}`;
    }
    console.log('error message: ', error.message);
    console.log('error stack: ', error.stack);
    return `API Error: ${error.message}`;
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

const createChatCompletion = async (messages, tools, memberId) => {

  const params = {
    model: TEXT_MODEL,
    messages,
    // temperature: 0.9,
    // max_tokens: 150,
    // top_p: 1,
    // frequency_penalty: 0,
    // presence_penalty: 0.6,
    user: memberId,
  };

  if (tools && tools.length) {
    params.tools = tools;
    params.tool_choice = 'auto';
  }

  return await openai.chat.completions.create(params);
}

module.exports = {
  GPT3_PREFIX,
  gpt3,
  openai, // for testing (is this really how you do it?)
};
