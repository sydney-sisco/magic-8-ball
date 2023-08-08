const reddit = require('../functions/reddit.js');

module.exports = [
  {
    ...reddit[0],
    prefix: '!reddit',
    execute: async (message, args, context) => {
      const postTitles = await fetchRedditFirstPage();
      message.channel.send(postTitles);
    },
  },
]

async function fetchRedditFirstPage() {
  try {
    const posts = await reddit[0].execute();

    let formattedPosts = "";

    posts.forEach(post => {
      formattedPosts += `${post.title}\n`;
    });

    return formattedPosts; 
  } catch (error) {
    console.error(`Error fetching Reddit first page: ${error.message}`);
  }
}
