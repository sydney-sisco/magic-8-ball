
module.exports = [
  {
    name: 'voice',
    description: 'text to speech',
    prefix: '!say',
    execute: async (message, args, context) => {
      voice(message);
    },
  }
]

const { connectToChannel, generateAudio, playAudio, audioQueue } = require('../util/voice.js');
const { startVoiceListener } = require('../features/voice-chat.js');
const { getOptions } = require('../util/shared-helpers.js');

const VOICE_PREFIX = '!say';

const voice = async (message) => {

  const userPromptWithOptions = message.content.slice(VOICE_PREFIX.length).trim();
  const [userPrompt, options] = getOptions(userPromptWithOptions);

  console.log('user prompt for voice: ', userPrompt);

  try {
    const filename = await generateAudio(userPrompt);
    // Add the generated audio file path to the queue
    audioQueue.push(filename);
  }
  catch (error) {
    console.error(error);
    return message.reply('Error generating audio: ' + error.message);
  }

  if (!message.member?.voice.channel) {
    return message.reply('You need to be in a voice channel for me to speak.');
  }

  const connection = await connectToChannel(message.member.voice.channel);

  // listen to users in the voice channel so they can talk to the bot
  startVoiceListener(connection, { message });

  playAudio(connection);
};
