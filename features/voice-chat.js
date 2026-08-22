// Voice chat: listens to users in a voice channel, transcribes their speech with
// Google Speech-to-Text, sends the transcript to the chatbot (sharing the same
// per-channel conversation context as text chat), and speaks the reply back via
// TTS — so users can talk to the bot in voice.
const { EndBehaviorType } = require('@discordjs/voice');
const { spawn } = require('node:child_process');
const prism = require('prism-media');
const speech = require('@google-cloud/speech');
const { speakText, playAudio, isPlaying } = require('../util/voice.js');
const { gpt3 } = require('./gpt3.js');

const speechClient = new speech.SpeechClient();

const SILENCE_DURATION_MS = 700; // how long of silence ends an utterance

// the bot only responds to utterances containing one of these trigger phrases
// (comma-separated in VOICE_TRIGGER_PHRASES, default "hey robot")
const VOICE_TRIGGER_PHRASES = (process.env.VOICE_TRIGGER_PHRASES || 'hey robot')
  .split(',')
  .map((s) => s.trim().toLowerCase())
  .filter(Boolean);

// checks a transcript for the trigger phrase; returns the request text with the
// trigger stripped out (or null if the utterance wasn't addressed to the bot)
const extractTriggeredPrompt = (transcript) => {
  const normalized = transcript.toLowerCase().replace(/\s+/g, ' ').trim();
  const trigger = VOICE_TRIGGER_PHRASES.find((p) => normalized.includes(p));
  if (!trigger) return null;

  const prompt = normalized
    .replace(trigger, ' ')
    .replace(/^[\s,.:;!?—-]+/, '')
    .trim();

  return prompt || null; // null when the utterance was just the trigger itself
};

const subscribers = new Map(); // userId -> { opusStream, decoder, ffmpeg }
const connectionsWithListener = new WeakSet(); // only attach one listener per connection
let processingUtterance = false; // don't overlap chatbot turns

// one-shot transcription of a WAV buffer (16kHz mono LINEAR16)
const transcribe = async (wavBuffer) => {
  const [response] = await speechClient.recognize({
    audio: { content: wavBuffer.toString('base64') },
    config: { encoding: 'LINEAR16', sampleRateHertz: 16000, languageCode: 'en-US' },
  });
  return response.results
    ?.map((r) => r.alternatives?.[0]?.transcript)
    .filter(Boolean)
    .join(' ') || '';
};

// build a fake discord message so the existing chatbot can process a voice utterance
const makeChatMessage = (channelId, userId) => ({
  id: `voice-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
  channelId,
  author: { id: userId },
  member: { id: userId },
  content: '!!',
  attachments: { size: 0, forEach: () => {} },
  reply: async () => {},
  react: async () => {},
});

const cleanup = (userId) => {
  const entry = subscribers.get(userId);
  if (!entry) return;
  subscribers.delete(userId);
  try { entry.opusStream?.destroy(); } catch (e) { /* already destroyed */ }
  try { entry.ffmpeg?.kill(); } catch (e) { /* already exited */ }
};

const startVoiceListener = (connection, { message }) => {
  if (connectionsWithListener.has(connection)) return;
  connectionsWithListener.add(connection);

  const botId = message.client?.user?.id;
  const contextChannelId = message.channelId;

  connection.receiver.speaking.on('start', (userId) => {
    if (userId === botId) return; // never transcribe the bot itself
    if (isPlaying()) return; // echo guard: don't listen while the bot is talking
    if (processingUtterance) return; // one chatbot turn at a time
    if (subscribers.has(userId)) return;

    const opusStream = connection.receiver.subscribe(userId, {
      end: { behavior: EndBehaviorType.AfterSilence, duration: SILENCE_DURATION_MS },
    });

    // decode opus (48kHz stereo) -> PCM
    const decoder = new prism.opus.Decoder({ rate: 48000, channels: 2, frameSize: 960 });

    // resample 48kHz stereo PCM -> 16kHz mono WAV for Google STT
    const ffmpeg = spawn('ffmpeg', [
      '-f', 's16le', '-ar', '48000', '-ac', '2', '-i', 'pipe:0',
      '-f', 'wav', '-ar', '16000', '-ac', '1', 'pipe:1',
    ]);

    const chunks = [];
    ffmpeg.stdout.on('data', (c) => chunks.push(c));
    ffmpeg.stderr.on('data', () => {}); // ffmpeg is chatty; ignore unless it fails

    subscribers.set(userId, { opusStream, decoder, ffmpeg });
    opusStream.on('error', () => cleanup(userId));
    decoder.on('error', () => cleanup(userId));

    opusStream.pipe(decoder).pipe(ffmpeg.stdin);

    ffmpeg.on('close', async () => {
      cleanup(userId);
      const wav = Buffer.concat(chunks);
      if (wav.length < 100) return; // nothing but silence

      let transcript;
      try {
        transcript = await transcribe(wav);
      } catch (error) {
        console.error('[voice] transcription error:', error.message);
        return;
      }
      if (!transcript.trim()) return;
      console.log(`[voice] <@${userId}> said: ${transcript}`);

      // only respond when the utterance was addressed to the bot
      const prompt = extractTriggeredPrompt(transcript);
      if (!prompt) {
        console.log('[voice] no trigger phrase, ignoring');
        return;
      }
      console.log(`[voice] triggered request: ${prompt}`);

      processingUtterance = true;
      try {
        const chatMessage = makeChatMessage(contextChannelId, userId);
        chatMessage.content = '!!' + prompt;

        const reply = await gpt3(chatMessage, [], {});
        if (!reply || typeof reply !== 'string') return;
        console.log(`[voice] bot reply: ${reply.slice(0, 200)}`);

        // sanitize markdown/emoji and chunk long replies so TTS doesn't fail
        await speakText(reply);
        playAudio(connection);
      } catch (error) {
        console.error('[voice] chatbot/TTS error:', error.message);
      } finally {
        processingUtterance = false;
      }
    });

    ffmpeg.on('error', () => cleanup(userId));
  });
};

module.exports = { startVoiceListener, extractTriggeredPrompt };
