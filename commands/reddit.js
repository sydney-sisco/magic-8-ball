module.exports = [
  {
    name: 'reddit',
    prefix: '!reddit',
    description: 'Fetches the first page of Reddit',
    execute: async (message, args, context) => {
      const postTitles = await fetchRedditFirstPage();
      message.channel.send(postTitles);
    },
  },
]

const axios = require('axios');

async function fetchRedditFirstPage() {
  try {
    const response = await axios.get('https://www.reddit.com/.json');
    const posts = response.data.data.children;

    let postTitles = '';
    
    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.data.title}`);
      postTitles += `${index + 1}. ${post.data.title}\n`;
    });

    return postTitles;

  } catch (error) {
    console.error(`Error fetching Reddit first page: ${error.message}`);
  }
}
