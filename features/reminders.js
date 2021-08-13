require('dotenv').config();
const AWS = require("aws-sdk");

AWS.config.update({
  region: process.env.DYNAMODB_REGION,
  endpoint: process.env.DYNAMODB_ENDPOINT ? process.env.DYNAMODB_ENDPOINT : null,
});

const docClient = new AWS.DynamoDB.DocumentClient();

const setReminder = (message) => {

  console.log('message:', message.content.substring(3));
  const [reminderTime, reminder] = message.content.substring(3).split(/ (.+)/);
  const reminderTimeStamp = new Date(reminderTime).getTime();
  
  if (!reminderTimeStamp) {
    message.reply('Invalid date. Use form YYYY-MM-DD@HH:MM:SS. Time is optional.');
    return;
  }

  if (reminderTimeStamp < new Date().getTime()) {
    message.reply('Reminder time must be in the future!');
    return;
  }

  console.log(reminder, reminderTime);

  const params = {
    TableName: process.env.DYNAMODB_JOBS_TABLE,
    Item: {
      id: 'reminder',
      timestamp: new Date(reminderTime).getTime(),
      text: reminder,
      time: message.time,
      message_id: message.id,
      user_id: message.author.id,
      channel_id: message.channel.id,
      status: 'pending',
    },
  };

  docClient.put(params, (err, data) => {
    if (err) {
      console.log(err, err.stack);
      message.reply(`Error: ${err}`);
    } else {
      console.log(data);
      message.reply('OK I will remind you about "' + reminder + '" at ' + reminderTime);
    }
  });
}

const sendReminder = (client, channelId, userId, message) => {

  const channel = client.channels.cache.find(channel => channel.id === channelId)
  channel.send(`<@${userId}> ${message}`);
}

const markCompleted = (reminder) => {
  const params = {
    TableName: process.env.DYNAMODB_JOBS_TABLE,
    Key: {
      id: reminder.id,
      timestamp: reminder.timestamp,
    },
    UpdateExpression: 'SET #status = :status',
    ExpressionAttributeNames: { "#status": "status" },
    ExpressionAttributeValues: {
      ':status': 'completed',
    },
  };
  docClient.update(params, (err, data) => {
    if (err) {
      console.log(err, err.stack);
    } else {
      console.log(data);
    }
  });
}

const getReminders = (client) => {

  setInterval(()=>{ 
    const params = {
      TableName: process.env.DYNAMODB_JOBS_TABLE,
      KeyConditionExpression: 'id = :id AND #timestamp BETWEEN :then AND :now',
      FilterExpression : '#status = :pending',
      ExpressionAttributeNames: { "#timestamp": "timestamp", "#status": "status" },
      ExpressionAttributeValues: {
        ':id': 'reminder',
        ':then': 0,
        ':now': new Date().getTime(),
        ':pending' : 'pending',
      },
    };
    docClient.query(params, (err, data) => {
      if (err) {
        console.log(err, err.stack);
      } else {
        console.log(data);
        const reminders = data.Items.map(item => {

          // send message to channel
          sendReminder(client, item.channel_id, item.user_id, item.text);

          // mark reminder as completed
          markCompleted(item);
        });
      }
    });
   }, 30 * 1000);
}


module.exports = {
  setReminder,
  getReminders,
};
