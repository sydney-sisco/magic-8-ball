require('dotenv').config()
const AWS = require("aws-sdk");

AWS.config.update({
  region: process.env.DYNAMODB_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT ? process.env.DYNAMODB_ENDPOINT : null,
});

const docClient = new AWS.DynamoDB.DocumentClient();

const log = message => {

  const data = {
    id: message.author.id,
    timestamp: new Date().getTime(),
    content: {
      content: message.content,
      type: message.type,
      channel: message.channel.id,
    }
  };

  const table = process.env.DYNAMODB_TABLE_NAME;

  docClient.put(
    {
      TableName: table,
      Item: data
    }, function(err, data) {
      if (err) {
        console.log("Unable to import data into DynamoDB. Error:", err);
      } else {
        console.log("Successfully imported data into DynamoDB.");
      }
    }
  );
};

module.exports = {
  log,
};
