const OpenAI = require("openai");
const openai = new OpenAI();

async function processImage(imageURL, messageText) {
  const response = await openai.chat.completions.create({
    model: "gpt-4-vision-preview",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: messageText },
          {
            type: "image_url",
            image_url: {
              "url": imageURL,
            },
          },
        ],
      },
    ],
  });
  console.log(response.choices[0]);
  return response.choices[0].message.content;
}

module.exports = {
  processImage,
};
