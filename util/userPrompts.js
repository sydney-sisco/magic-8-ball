const crypto = require('crypto');

function generateUniqueFilename(prompt) {
  const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9 -]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  const uniqueId = crypto.randomUUID().substring(0, 8);

  const filename = `${sanitizedPrompt}_${uniqueId}.png`;

  return filename;
}

module.exports = { generateUniqueFilename };

// Example usage
// const filename = generateUniqueFilename("User's prompt with special characters!?");
// console.log(filename);
