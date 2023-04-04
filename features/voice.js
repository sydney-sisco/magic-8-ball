const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

const { createReadStream } = require('node:fs');
const { join } = require('node:path');

const {
  joinVoiceChannel,
  VoiceConnectionStatus,
  createAudioPlayer,
  createAudioResource,
  StreamType,
} = require('@discordjs/voice');

const client = new textToSpeech.TextToSpeechClient();
async function quickStart() {
  const text = 'hello, world!';
  // const text = 'こんにちは、世界！';
//   const text = `. Intergalactic Taco Invasion: Mysterious aliens have infiltrated the United States under the guise of a popular fast-food chain, "Galactic Tacos." They've been secretly collecting human data through taco sales and causing an uncontrollable craving for tacos in millions of people. Brace yourselves for the impending "Tacopalypse!"
// 2. Sudden Outbreak of Polka-Dotitis: A peculiar disease called "Polka-Dotitis" has taken over the country, causing people to develop brightly colored polka dots all over their bodies. No one knows how the outbreak started or how to cure it, but one thing's for sure – everyone's fashion sense has skyrocketed!
// 3. Gravity-Defying Shoes Craze: An inventor created shoes that defy gravity, giving people the ability to float and walk on air. While this breakthrough seemed amazing at first, chaos ensued as individuals began floating away uncontrollably, and rooftops became the new sidewalks. The world has turned upside down, quite literally!
// 4. Pogo-Stick Pigeons Running Amok: A mysterious lab experiment resulted in super-intelligent pigeons capable of riding pogo sticks. These birds have taken to the streets, bouncing around on their pogo sticks and causing mayhem everywhere they go. Beware of the bird droppings from the sky!
// 5. Attack of the Jumbo Gummy Bears: An enormous batch of gummy bears mutated in a candy factory, turning them into giant, bouncing, multicolored beasts. These giant gummy bears have now invaded cities, causing widespread panic as they bounce their way through the streets, crushing cars and toppling buildings in their path.`


  const request = {
    input: { text: text },
    voice: {
      // languageCode: "en-US",
      // name: "en-US-Studio-O",
      // ssmlGender: "FEMALE"
      languageCode: "ja-JP",
      name: "ja-JP-Neural2-B",
      ssmlGender: "FEMALE"
    },
    audioConfig: { audioEncoding: 'MP3' },
  };

  const [response] = await client.synthesizeSpeech(request);
  
  // Write the binary audio content to a local file
  const writeFile = util.promisify(fs.writeFile);
  await writeFile('output.mp3', response.audioContent, 'binary');
  console.log('Audio content written to file: output.mp3');
}
// quickStart();
function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const { getOptions } = require('../util/shared-helpers.js');
const VOICE_PREFIX = '!say';

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

  /**
   * If we're dealing with a connection that isn't yet Ready, we can set a reasonable
   * time limit before giving up. In this example, we give the voice connection 30 seconds
   * to enter the ready state before giving up.
   */
  // try {
  //   /**
  //    * Allow ourselves 30 seconds to join the voice channel. If we do not join within then,
  //    * an error is thrown.
  //    */
  //   await entersState(connection, VoiceConnectionStatus.Ready, 30_000)
  //   /**
  //    * At this point, the voice connection is ready within 30 seconds! This means we can
  //    * start playing audio in the voice channel. We return the connection so it can be
  //    * used by the caller.
  //    */
  //   return connection
  // } catch (error) {
  //   /**
  //    * At this point, the voice connection has not entered the Ready state. We should make
  //    * sure to destroy it, and propagate the error by throwing it, so that the calling function
  //    * is aware that we failed to connect to the channel.
  //    */
  //   connection.destroy()
  //   throw error
  // }
}

const voice = async (message) => {

  const userPromptWithOptions = message.content.slice(VOICE_PREFIX.length).trim();
  const [userPrompt, options] = getOptions(userPromptWithOptions);

  console.log(userPrompt);

  // const connection = joinVoiceChannel({
  //   channelId: message.channel.id,
  //   guildId: message.channel.guild.id,
  //   adapterCreator: message.channel.guild.voiceAdapterCreator,
  // });

  const connection = await connectToChannel(message.member?.voice.channel);

  connection.on(VoiceConnectionStatus.Ready, async () => {
    console.log('The connection has entered the Ready state - ready to play audio!');

    // sleep 1 second using await
    await sleep(1000);
    const player = createAudioPlayer();
    // const resource = createAudioResource('./output.mp3');
    // // resource = createAudioResource(join(__dirname, 'file.mp3'), { inlineVolume: true });
    // // resource.volume.setVolume(0.5);
    // // const resource = connection.play('./output.mp3');
    // player.play(resource);
    // const resource = createAudioResource('./output.mp3');
    const resource = createAudioResource(
      "https://storage.googleapis.com/photo-gallery-8072626/samples/goo.mp3"
    )
    player.play(resource);
    connection.subscribe(player);
  });



};
module.exports = {
  VOICE_PREFIX,
  voice
};