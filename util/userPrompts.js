const crypto = require('crypto');

// remove special characters but keep spaces
const removeSpecialChars = (str) => {
  return str.replace(/[^a-zA-Z0-9 -]/g, '');
}

function generateUniqueFilename(prompt) {
  const sanitizedPrompt = prompt.replace(/[^a-zA-Z0-9 -]/g, '')
    .replace(/\s+/g, '_')
    .substring(0, 50);
  
  const uniqueId = crypto.randomUUID().substring(0, 8);

  const filename = `${sanitizedPrompt}_${uniqueId}.png`;

  return filename;
}

module.exports = {
  generateUniqueFilename,
  removeSpecialChars,
};
