const axios = require('axios');

async function fetchRedditFirstPage() {
  try {
    const response = await axios.get('https://www.reddit.com/.json');
    const posts = response.data.data.children;

    posts.forEach((post, index) => {
      console.log(`${index + 1}. ${post.data.title}`);
    });
  } catch (error) {
    console.error(`Error fetching Reddit first page: ${error.message}`);
  }
}

fetchRedditFirstPage();
