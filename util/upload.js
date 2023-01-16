const fs = require('fs')
const aws = require('aws-sdk');
// require('dotenv').config()

// Set S3 endpoint to DigitalOcean Spaces
const spacesEndpoint = new aws.Endpoint('sfo3.digitaloceanspaces.com');
const s3 = new aws.S3({
  endpoint: spacesEndpoint,
  accessKeyId: process.env.DO_SPACES_ACCESS_KEY_ID,
  secretAccessKey: process.env.DO_SPACES_SECRET_ACCESS_KEY,
});


const uploadImage = async (imagePath, prompt, member) => {
  const blob = fs.readFileSync(imagePath)

  const Key = `${prompt.replaceAll(' ', '_')}.png`

  const metadata = {
    // 'Content-type': 'image/png',
    'x-amz-acl': 'public-read',
    'member': member,
    'prompt': prompt,
  }

  const uploadedImage = await s3.upload({
    Bucket: process.env.DO_SPACES_NAME,
    Key,
    Body: blob,
    ACL: 'public-read',
    ContentType: 'image/png',
    Metadata: metadata,
  }).promise()

  console.log('DO res: ', uploadedImage);
  console.log('DO url: ', uploadedImage.Location);

  return uploadedImage.Location
};

module.exports = {
  uploadImage,
};
