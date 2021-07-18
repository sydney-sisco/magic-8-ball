require('dotenv').config()
var AWS = require("aws-sdk");

AWS.config.update({
  region: process.env.DYNAMODB_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT
});

var dynamodb = new AWS.DynamoDB();

var params = {
    TableName : process.env.DYNAMODB_TABLE_NAME,
    KeySchema: [       
        { AttributeName: "id", KeyType: "HASH"},
        { AttributeName: "timestamp", KeyType: "RANGE"}
        ],
    AttributeDefinitions: [       
        { AttributeName: "id", AttributeType: "S" },
        { AttributeName: "timestamp", AttributeType: "N" },
        ],
    ProvisionedThroughput: {       
        ReadCapacityUnits: 5, 
        WriteCapacityUnits: 5
       }
};

dynamodb.createTable(params, function(err, data) {
    if (err) {
        console.error("Unable to create table. Error JSON:", JSON.stringify(err, null, 2));
    } else {
        console.log("Created table. Table description JSON:", JSON.stringify(data, null, 2));
    }
});
