
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


const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');
const { join } = require('node:path');

const {
  joinVoiceChannel,
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
} = require('@discordjs/voice');

const client = new textToSpeech.TextToSpeechClient();
async function generateAudio(text) {
  try {
    const request = {
      input: { text: text },
      voice: {
        // languageCode: "en-AU",
        // name: "en-AU-News-E",
        // ssmlGender: "FEMALE"
        languageCode: "en-US",
        name: "en-US-Studio-O",
        ssmlGender: "FEMALE"
        // languageCode: "ja-JP",
        // name: "ja-JP-Neural2-B",
        // ssmlGender: "FEMALE"
        // languageCode: "ja-JP",
        // name: "ja-JP-Neural2-D",
        // ssmlGender: "MALE"
      },
      audioConfig: { audioEncoding: 'MP3' },
    };
    
    const [response] = await client.synthesizeSpeech(request);

    // Write the binary audio content to a local file
    const filename = `output-${Date.now()}.mp3`;
    const writeFile = util.promisify(fs.writeFile);
    await writeFile(join(__dirname, filename), response.audioContent, 'binary');
    console.log(`Audio content written to file: ${filename}`);
    return filename;
  }
  catch (error) {
    console.error(error);
    throw error;
  }
}

const { getOptions } = require('../util/shared-helpers.js');
const VOICE_PREFIX = '!say';
const audioQueue = [];

async function connectToChannel(channel) {
  /**
   * Here, we try to establish a connection to a voice channel. If we're already connected
   * to this voice channel, @discordjs/voice will just return the existing connection for us!
   */
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    // adapterCreator: createDiscordJSAdapter(channel)
  })

  return connection;
}

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

  const connection = await connectToChannel(message.member?.voice.channel);

  playAudio(connection);
};

const audioPlayer = createAudioPlayer();

async function playAudio(connection) {

  // If audioPlayer is not playing and there's an audio file in the queue, play it
  if (
    audioPlayer.state.status !== AudioPlayerStatus.Playing &&
    audioQueue.length > 0
  ) {
    const fileToPlay = audioQueue.shift(); // Get the first file from the queue and remove it
    const audioResource = createAudioResource(join(__dirname, fileToPlay));

    audioPlayer.play(audioResource);
    connection.subscribe(audioPlayer);

    audioPlayer.on('error', (error) => {
      console.error('Error occurred during audio playback:', error);
    });

    audioPlayer.on(AudioPlayerStatus.Idle, () => {
      if (audioQueue.length > 0) {
        playAudio(connection); // If there are more files in the queue, play the next one
      }
    });
  }
}
