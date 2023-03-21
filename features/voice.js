const textToSpeech = require('@google-cloud/text-to-speech');
const fs = require('fs');
const util = require('util');

const client = new textToSpeech.TextToSpeechClient();
async function quickStart() {
  // const text = 'hello, world!';
  // const text = 'こんにちは、世界！';
  const text = `. Intergalactic Taco Invasion: Mysterious aliens have infiltrated the United States under the guise of a popular fast-food chain, "Galactic Tacos." They've been secretly collecting human data through taco sales and causing an uncontrollable craving for tacos in millions of people. Brace yourselves for the impending "Tacopalypse!"
2. Sudden Outbreak of Polka-Dotitis: A peculiar disease called "Polka-Dotitis" has taken over the country, causing people to develop brightly colored polka dots all over their bodies. No one knows how the outbreak started or how to cure it, but one thing's for sure – everyone's fashion sense has skyrocketed!
3. Gravity-Defying Shoes Craze: An inventor created shoes that defy gravity, giving people the ability to float and walk on air. While this breakthrough seemed amazing at first, chaos ensued as individuals began floating away uncontrollably, and rooftops became the new sidewalks. The world has turned upside down, quite literally!
4. Pogo-Stick Pigeons Running Amok: A mysterious lab experiment resulted in super-intelligent pigeons capable of riding pogo sticks. These birds have taken to the streets, bouncing around on their pogo sticks and causing mayhem everywhere they go. Beware of the bird droppings from the sky!
5. Attack of the Jumbo Gummy Bears: An enormous batch of gummy bears mutated in a candy factory, turning them into giant, bouncing, multicolored beasts. These giant gummy bears have now invaded cities, causing widespread panic as they bounce their way through the streets, crushing cars and toppling buildings in their path.`


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
quickStart();