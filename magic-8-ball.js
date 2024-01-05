require('dotenv').config()

const { Client, GatewayIntentBits, Partials, ChannelType } = require('discord.js');

const client = new Client({
  partials: [Partials.Message, Partials.User, Partials.Channel, Partials.Reaction],
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMessageReactions,
    GatewayIntentBits.GuildVoiceStates,
    // add DM intents
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.DirectMessageTyping,
    GatewayIntentBits.DirectMessageReactions,
  ],
});


// load command line interface
rl = require('./features/command-line-interface.js')(client);

// load additional commands
const { loadCommands } = require('./commands/index.js');
const commands = loadCommands();

const PREFIX = '!8';

const divinations = [
  'It is certain.',
  'It is decidedly so.',
  'Without a doubt.',
  'Yes – definitely.',
  'You may rely on it.',
  'As I see it, yes.',
  'Most likely.',
  'Outlook good.',
  'Yes.',
  'Signs point to yes.',
  'Reply hazy, try again.',
  'Ask again later.',
  'Better not tell you now.',
  'Cannot predict now.',
  'Concentrate and ask again.',
  'Don\'t count on it.',
  'My reply is no.',
  'My sources say no.',
  'Outlook not so good.',
  'Very doubtful.'
];

const scry = () => {
  return divinations[Math.floor(Math.random() * divinations.length)];
};

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}!`);

  if (process.env.ADMIN_CHANNEL_ID) {
    const channel = client.channels.cache.get(process.env.ADMIN_CHANNEL_ID);
    channel.send(`[System]: Online: ${client.user.tag}`);

    // load cron jobs
    if (process.env.FF_CRON_JOBS) {
      console.log('\x1b[32m%s\x1b[0m', '✅ Cron jobs enabled');
      require('./features/cron-jobs.js')(client, channel);
    } else {
      console.log('\x1b[31m%s\x1b[0m', '❌ Cron jobs disabled');
    }
  }
});

client.on('messageCreate', async message => {
  // ignore messages sent by bots
  if (message.author.bot) {
    return;
  }

  // check if message starts with a command prefix
  const matchedCommand = [
    ...commands.values()
  ].find((command) => message.content.startsWith(command.prefix));

  // if a command is matched, execute it
  if (matchedCommand) {
    const args = message.content.slice(matchedCommand.prefix.length).trim().split(/ +/);
    matchedCommand.execute(message, args, { client, rl, commands });
  }

  if (message.content.startsWith(PREFIX)) {
    message.reply(`🎱 ${scry()} 🎱`);
    return;
  }

  // check for mention of bot
  if (message.mentions.has(client.user)) {
    const messageWithoutMention = message.content.replace(`<@${client.user.id}>`, '').trim();
    message.content = '!!' + messageWithoutMention;

    const args = messageWithoutMention.split(/ +/);
    commands.get('chat').execute(message, args, { client, rl, commands });

    return;
  }
});

client.login(process.env.DISCORD_BOT_TOKEN);
