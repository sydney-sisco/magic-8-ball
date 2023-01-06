const { Configuration, OpenAIApi } = require("openai");
const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// const prompt = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.`;
// const temperature = 0.9;
// const maxTokens = 150;
// (async () => {
//   const gptResponse = await openai.complete({
//     engine: 'davinci',
//     prompt: 'this is a test',
//     maxTokens: 5,
//     temperature: 0.9,
//     topP: 1,
//     presencePenalty: 0,
//     frequencyPenalty: 0,
//     bestOf: 1,
//     n: 1,
//     stream: false,
//     stop: ['\n', "testing"]
//   });

//   console.log(gptResponse.data);
// })();

// The following is a conversation with an AI assistant.The assistant is helpful, creative, clever, and very friendly.

//   Human: Hello, who are you ?
//   AI: I am an AI created by OpenAI.How can I help you today ?
//   Human: 


const GPT3_PREFIX = '!!';

const gpt3 = async (message) => {
  const userPrompt = message.content.slice(GPT3_PREFIX.length).trim();
  const temperature = 0.9;
  const maxTokens = 150;

  // const prompt = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: ${userPrompt}`;
  const prompt = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n\nHuman: Hello, who are you?\nAI: I am an AI created by OpenAI. How can I help you today?\nHuman: ${userPrompt}\nAI: `;

  const response = await openai.createCompletion({
    model: "text-davinci-003",
    prompt: prompt,
    temperature: 0.9,
    max_tokens: 150,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0.6,
    stop: [" Human:", " AI:"],
  });

  console.log(response.data.choices[0].text);

  const gptMessage = response.data.choices[0].text.trim();

  // const gptMessage = response.data.choices[0].text;


  return `${gptMessage}`;
}

module.exports = {
  GPT3_PREFIX,
  gpt3
};
