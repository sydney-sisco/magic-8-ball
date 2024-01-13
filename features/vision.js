const OpenAI = require("openai");
const openai = new OpenAI();

async function processImage(imageURL, messageText) {
  try {
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
                // detail: "low",
              },
            },
          ],
        },
      ],
    });
    console.log(response.choices[0]);
    return response.choices[0].message.content;

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
  processImage,
};
