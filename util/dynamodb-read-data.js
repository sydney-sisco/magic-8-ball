require('dotenv').config()
var AWS = require("aws-sdk");

AWS.config.update({
  region: process.env.DYNAMODB_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT ? process.env.DYNAMODB_ENDPOINT : undefined,
});

var docClient = new AWS.DynamoDB.DocumentClient();

var table = process.env.DYNAMODB_TABLE_NAME;

var id = '184039710513954818';
// var title = "The Big New Movie";

var params = {
  TableName: table,
  KeyConditionExpression: "id = :a",
  ExpressionAttributeValues: {
      ":a": "184039710513954818"
  }
};

docClient.query(params, function(err, data) {
    if (err) {
        console.error("Unable to read item. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("GetItem succeeded:", JSON.stringify(data, null, 2));
    }
});
