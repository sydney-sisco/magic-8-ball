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

const humanIdentifier = `\nHuman: `;
const aiIdentifier = '\nAI: ';
const context = [];
const prompt = `The following is a conversation with an AI assistant. The assistant is helpful, creative, clever, and very friendly.\n${humanIdentifier}Hello, who are you?${aiIdentifier}I am an AI created by OpenAI. How can I help you today?`;

const gpt3 = async (message) => {
  const userPrompt = message.content.slice(GPT3_PREFIX.length).trim();
  // const temperature = 0.9;
  // const maxTokens = 150;

  manageContext(userPrompt);

  // context.push(`${humanIdentifier}${userPrompt}`);

  let response;
  try {
    response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: `${prompt}${context}${aiIdentifier}`,
      temperature: 0.9,
      max_tokens: 150,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0.6,
      stop: [" Human:", " AI:"],
    });
  } catch (error) {
    console.log(error);
  }

  console.log(response);

  if (response.data.error) {
    console.log(response.data.error);
    return response.data.error.message
  }

  console.log(response.data.choices[0].text);

  context.push(`${aiIdentifier}${response.data.choices[0].text.trim()}`);

  const gptMessage = response.data.choices[0].text.trim();

  // const gptMessage = response.data.choices[0].text;

  return `${gptMessage}`;
}

const manageContext = userPrompt => {
  if (context.length > 25) {
    context.shift();
  }
  
  context.push(`${humanIdentifier}${userPrompt}`);
}



module.exports = {
  GPT3_PREFIX,
  gpt3
};
