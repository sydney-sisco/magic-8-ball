// Description: This command is used to list out all the other commands.

module.exports =[{
  name: 'help',
  description: 'List all commands',
  prefix: '!help',
  execute: (message, args, context) => {
    const { commands } = context;
    
    let reply = 'Here are the available commands:\n';

    for (const [ ,cmd] of commands) {
      reply += `**${cmd.prefix}**: ${cmd.description}\n`;
    }

    message.channel.send(reply);
  },
}];
