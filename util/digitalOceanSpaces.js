const AWS = require('aws-sdk');
var axios = require('axios');
const { generateUniqueFilename } = require('./userPrompts.js');

const SPACES_ENDPOINT = process.env.DO_SPACES_ENDPOINT;
const SPACES_NAME = process.env.DO_SPACES_NAME;
const SPACES_KEY = process.env.DO_SPACES_ACCESS_KEY_ID
const SPACES_SECRET = process.env.DO_SPACES_SECRET_ACCESS_KEY

let s3;

// saves an image to Digital Ocean Spaces and returns the URL
const saveImage = async (url, prompt, member) => {

  s3 = new AWS.S3({
    endpoint: SPACES_ENDPOINT,
    accessKeyId: SPACES_KEY,
    secretAccessKey: SPACES_SECRET
  })
  
  const response = await axios.get(url, { responseType: 'arraybuffer' })
  const buffer = Buffer.from(response.data, "utf-8")


  const filename = generateUniqueFilename(prompt);

  const metadata = {
    'x-amz-acl': 'public-read',
    'member': member,
    'prompt': prompt,
    'created': new Date().toISOString(),
  }

  const uploadedImage = await s3.upload({
    Bucket: SPACES_NAME,
    Key: filename,
    Body: buffer,
    ACL: 'public-read',
    ContentType: 'image/png',
    Metadata: metadata,
  }).promise()

  console.log('DO res: ', uploadedImage);

  return uploadedImage.Location;
};


module.exports = { saveImage };
