const chatCompletion = require('../functions/chat_completion.js');
const reddit = require('../functions/reddit.js');

module.exports = [
  {
    name: '!checkreddit',
    prefix: '!checkreddit',
    description: 'Have the bot check reddit for interesting posts',
    execute: async (message, args, context) => {
      // const postTitles = await reddit[0].execute();
      // message.channel.send(postTitles);

      const posts = await reddit[0].execute();

      let formattedPosts = "";

      posts.forEach(post => {
        formattedPosts += `${post.title}\n`;
      });

      const messages = [
        { "role": "system", "content": "the following are the current top posts on reddit. Please analyze them for anything absolutely ground breaking. There will likely be nothing. If there is nothing simply return null." },
        { "role": "user", "content": formattedPosts },
      ]

      const result = await chatCompletion[0].execute(messages);
      const botResponse = result.choices[0].message.content;

      message.channel.send(botResponse);
    },
  },
]
