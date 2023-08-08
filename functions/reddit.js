module.exports = [
  {
    name: 'reddit',
    description: 'Fetches the first page of Reddit',
    parameters: {
      type: 'object',
      properties: {},
    },
    execute: async (message, args, context) => {
      const postTitles = await fetchRedditFirstPage();
      return postTitles;
    },
  },
]

const axios = require('axios');

async function fetchRedditFirstPage() {
  try {
    const response = await axios.get('https://www.reddit.com/.json');
    const posts = response.data.data.children;

    let postTitles = [];
    
    posts.forEach((post, index) => {
      postTitles.push({number: index + 1, title: post.data.title, subreddit: post.data.subreddit});
    });

    return postTitles; 

  } catch (error) {
    console.error(`Error fetching Reddit first page: ${error.message}`);
    return { error: `Error fetching Reddit first page: ${error.message}` };
  }
}
