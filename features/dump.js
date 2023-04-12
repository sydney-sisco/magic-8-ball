// debug stuff

const DUMP_PREFIX = '!dump';

// format as markdown for discord
function objectToMarkdown(obj) {
  let markdown = "```\n";

  for (const key in obj) {
    if (Object.hasOwnProperty.call(obj, key)) {
      markdown += key + ": " + obj[key] + "\n";
    }
  }

  markdown += "```\n";

  return markdown;
}

// print debug info to console and discord
const dump = function (message) {

  // Check if the message is sent in a thread
  let thread = null;
  if (message.channel.type === 11 && message.channel.parentId) {
    console.log(`Message sent in thread: ${message.channel.name}`);
    console.log(`Thread ID: ${message.channel.id}`);
    thread = {
      id: message.channel.id,
      name: message.channel.name,
      parentId: message.channel.parentId,
    }
  }

  const msg = {
    messageId: message.id,
    content: message.content,
    channelId: message.channelId,
    threadId: thread?.id,
    threadName: thread?.name,
    threadParentId: thread?.parentId,
    guildId: message.guildId,
    author: message.author,
  }

  console.log(`dump: ${JSON.stringify(msg)}`);
  message.reply(`dump: ${objectToMarkdown(msg)}`);
};

module.exports = {
  DUMP_PREFIX,
  dump
};
