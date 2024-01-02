// a very basic chat completion function 

module.exports = [
  {
    name: 'chat_completion',
    prefix: '!chat',
    description: 'generate a chat response',
    parameters: {
      type: 'object',
      properties: {
        messages: {
          type: 'array',
          description: 'The messages to send to the chatbot',
        },
        functions: {
          type: 'array',
          description: 'The functions to send to the chatbot',
        },
        memberId: {
          type: 'string',
          description: 'The member id to send to the chatbot',
        },
      },
    },
    execute: async (message, args, context) => {
      const chatResponse = await createChatCompletion(message);
      return chatResponse;
    },
  },
]

const TEXT_MODEL = 'gpt-3.5-turbo';
const OpenAI = require("openai");
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const createChatCompletion = async (messages, functions, memberId) => {
  return await openai.chat.completions.create({
    model: TEXT_MODEL,
    messages,
    functions: !functions || !functions.length ? undefined : functions,
    // temperature: 0.9,
    // max_tokens: 150,
    // top_p: 1,
    // frequency_penalty: 0,
    // presence_penalty: 0.6,
    user: memberId || 'system',
  });
}
