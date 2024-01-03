const chatCompletion = require('../functions/chat_completion.js');
const reddit = require('../functions/reddit.js');

module.exports = [
  {
    name: '!checkreddit',
    prefix: '!checkreddit',
    description: 'Have the bot check reddit for interesting posts',
    execute: async (message, args, context) => {

      const posts = await reddit[0].execute();

      let formattedPosts = "";

      posts.forEach(post => {
        formattedPosts += `${post.title}\n`;
      });

      console.log(formattedPosts);

      // formattedPosts = "Cat stuck in tree in rescued by local teen\nWORLD ALERT - JAPAN 7.4 EARTHQUAKE\nCanada expects a cold winter\nSmall fire in a local restaurant\n"

      const messages = [
        { "role": "system", "content": "You are a world emergency detection bot. You are programmed to analyse headlines and filter them down to only breaking news of major world emergencies such as earthquakes, hurricanes, wars. Return only the major world events. You will often find nothing of interest, when that happens please return an empty array. Please return the filtered posts in a JSON array.{\"news\": []}" },
        { "role": "user", "content": formattedPosts },
      ];

      const result = await chatCompletion[0].execute(messages);
      const botResponse = result.choices[0].message.content;

      console.log(botResponse);

      message.channel.send(botResponse); 
    },
  },
]
