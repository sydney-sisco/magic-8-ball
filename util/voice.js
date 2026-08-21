// Shared voice machinery: joining voice channels, GCP text-to-speech,
// and audio playback. Used by the !say command and the voice-chat listener
// (features/voice-chat.js).
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

// the hardcoded voice used for TTS (Chinese male)
const VOICE = {
  languageCode: 'cmn-CN',
  name: 'cmn-CN-Chirp3-HD-Schedar',
  ssmlGender: 'MALE',
};

// strip markdown, emojis, and URLs so the TTS engine doesn't choke on them
const sanitizeForTTS = (text) => {
  return String(text)
    .replace(/```[\s\S]*?```/g, ' ')                // code blocks
    .replace(/`([^`]*)`/g, '$1')                     // inline code
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')         // markdown links -> link text
    .replace(/https?:\/\/\S+/g, ' ')                 // bare URLs
    .replace(/[*_~#>|]/g, ' ')                       // markdown chars -> spaces
    .replace(/[\u{1F000}-\u{1FAFF}\u{2B00}-\u{2BFF}\u{2600}-\u{27BF}\u{FE0F}]/gu, '') // emojis
    .replace(/\s+/g, ' ')
    .trim();
};

// split long text into sentence-based chunks (GCP TTS rejects very long input)
const splitIntoChunks = (text, maxLen = 1200) => {
  const sentences = text.split(/(?<=[.!?。！？])\s+/);
  const chunks = [];
  let current = '';

  for (const sentence of sentences) {
    if (current && (current + ' ' + sentence).length > maxLen) {
      chunks.push(current);
      current = sentence;
    } else {
      current = current ? `${current} ${sentence}` : sentence;
    }
  }
  if (current) chunks.push(current);
  return chunks;
};

async function generateAudio(text) {
  try {
    const request = {
      input: { text: sanitizeForTTS(text) },
      voice: VOICE,
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

// sanitize, split into chunks, synthesize each, and queue them for playback
async function speakText(text) {
  const chunks = splitIntoChunks(sanitizeForTTS(text));
  for (const chunk of chunks) {
    audioQueue.push(await generateAudio(chunk));
  }
  return chunks.length;
}

const audioQueue = [];
const audioPlayer = createAudioPlayer();

async function connectToChannel(channel) {
  /**
   * Here, we try to establish a connection to a voice channel. If we're already connected
   * to this voice channel, @discordjs/voice will just return the existing connection for us!
   *
   * selfDeaf must be false so the bot receives audio from other users (otherwise it shows
   * the deafened icon and can't hear anything).
   */
  const connection = joinVoiceChannel({
    channelId: channel.id,
    guildId: channel.guild.id,
    adapterCreator: channel.guild.voiceAdapterCreator,
    selfDeaf: false,
    selfMute: false,
  });

  return connection;
}

function playAudio(connection) {
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

// is the bot currently playing audio? (used to ignore speech while the bot talks)
function isPlaying() {
  return audioPlayer.state.status === AudioPlayerStatus.Playing;
}

module.exports = {
  connectToChannel,
  generateAudio,
  speakText,
  playAudio,
  isPlaying,
  sanitizeForTTS,
  splitIntoChunks,
  audioQueue,
  audioPlayer,
};
