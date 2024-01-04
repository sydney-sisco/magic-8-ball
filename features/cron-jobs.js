const cron = require('node-cron');
const reddit = require('../functions/reddit.js');
const chatCompletion = require('../functions/chat_completion.js');

const TEST_CHANNEL_ID = process.env.TEST_CHANNEL_ID;
const LOGGING_CHANNEL_ID = process.env.LOGGING_CHANNEL_ID;

module.exports = (client, channel) => {
  const logging_channel = client.channels.cache.get(LOGGING_CHANNEL_ID);
  const test_channel = client.channels.cache.get(TEST_CHANNEL_ID);

  checkReddit(test_channel);
  cron.schedule('0 * * * *', () => {
    logging_channel.send(`[System]: Checking reddit`);
    checkReddit(test_channel);
    logging_channel.send(`[System]: Reddit check complete`);
  });

  console.log('Cron jobs loaded');
}

const checkReddit = async (channel) => {

  const posts = await reddit[0].execute();

  let formattedPosts = "";

  posts.forEach(post => {
    formattedPosts += `${post.title}\n`;
  });

  console.log(formattedPosts);

  const messages = [
    { "role": "system", "content": "You are a world emergency detection bot. You are programmed to analyse headlines and filter them down to only breaking news of major world emergencies such as earthquakes, hurricanes, wars. Return only the major world events. You will often find nothing of interest, when that happens please return an empty array. Please return the filtered posts in a JSON array.{\"news\": []}" },
    { "role": "user", "content": formattedPosts },
  ];

  const result = await chatCompletion[0].execute(messages);
  const botResponse = result.choices[0].message.content;

  console.log(botResponse);

  channel.send(botResponse); 
}