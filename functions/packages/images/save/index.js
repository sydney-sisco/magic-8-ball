const AWS = require('aws-sdk');
const axios = require('axios');
const SPACES_ENDPOINT = process.env['SPACES_ENDPOINT'];
const SPACES_NAME = process.env['SPACES_NAME'];
const SPACES_KEY = process.env['SPACES_KEY']
const SPACES_SECRET = process.env['SPACES_SECRET']

const s3 = new AWS.S3({
  endpoint: SPACES_ENDPOINT,
  accessKeyId: SPACES_KEY,
  secretAccessKey: SPACES_SECRET
})

async function main(args) {
  // console.log('args', args);
  const { url, prompt, member } = args;

  if (!url || !prompt || !member) {
    console.log('missing url, prompt or member');
    return {
      statusCode: 400,
      body: {
        message: 'missing url, prompt or member',
      }
    }
  }

  const response = await axios.get(args.url, { responseType: 'arraybuffer' })
  const buffer = Buffer.from(response.data, "utf-8")

  // const Key = `${prompt.replaceAll(' ', '_')}.png` // not supported in node 14 apparently

  var find = ' ';
  var re = new RegExp(find, 'g');
  const Key = `${prompt.replace(re, '_')}.png`;
  // string = string.replace(/[^a-zA-Z0-9]/g, ''); // remove all non-alphanumeric characters

  const metadata = {
    'x-amz-acl': 'public-read',
    'member': member,
    'prompt': prompt,
    'created': new Date().toISOString(),
  }

  const uploadedImage = await s3.upload({
    Bucket: SPACES_NAME,
    Key,
    Body: buffer,
    ACL: 'public-read',
    ContentType: 'image/png',
    Metadata: metadata,
  }).promise()

  console.log('DO res: ', uploadedImage);

  return {
    statusCode: 200,
    body: {
      message: 'success',
      metadata,
      Key,
      url: uploadedImage.Location,
    }
  }
}

exports.main = main;
