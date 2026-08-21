const { isDiscordCDN, getQueryParamValue, hexToDecimal } = require('./url-helpers');
const db = require('./db.js');

const CONTEXT_LENGTH = process.env.OPENAI_CONTEXT_LENGTH || 1000;
const CONTEXT_MESSAGES_LIMIT = process.env.CONTEXT_MESSAGES_LIMIT || 10;

const date = new Date();

const day = String(date.getDate()).padStart(2, '0');
const month = String(date.getMonth() + 1).padStart(2, '0'); //January is 0!
const year = date.getFullYear();
const today = `${year}-${month}-${day}`;

const defaultSystemMessage = `You are Magic 8-Ball, a large language model based on the GPT-4 architecture. Knowledge cutoff: 2021-09. Current date: ${today}.`;

// --- SQLite setup ---
// Conversation history and channel metadata are stored in a local SQLite database
// (previously stored in Google Cloud Firestore). The connection is shared via util/db.js.
db.exec(`
  CREATE TABLE IF NOT EXISTS channels (
    channel_id TEXT PRIMARY KEY,
    system_message TEXT,
    context_timestamp INTEGER NOT NULL DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id TEXT,
    member TEXT,
    channel_id TEXT NOT NULL,
    role TEXT NOT NULL,
    message TEXT,
    name TEXT,
    tool_call_id TEXT,
    tool_calls TEXT,
    timestamp INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_messages_channel_timestamp
    ON messages (channel_id, timestamp DESC);
`);

// migrate databases created before tool-calling support
const messageColumns = db.prepare('PRAGMA table_info(messages)').all().map((c) => c.name);
if (!messageColumns.includes('tool_call_id')) {
  db.exec('ALTER TABLE messages ADD COLUMN tool_call_id TEXT');
}
if (!messageColumns.includes('tool_calls')) {
  db.exec('ALTER TABLE messages ADD COLUMN tool_calls TEXT');
}

class ConversationContext {

  static instances = {};

  // returns a ConversationContext instance for the given channelId
  static async getConversation(channelId) {
    
    // if the context is not in memory, try loading it from sqlite
    if (!this.instances[channelId]) {
      this.instances[channelId] = new ConversationContext(channelId);

      // allow context skip by passing falsy channelId
      // TODO: probably remove this
      if (!channelId) {
        return this.instances[channelId];
      }

      await this.instances[channelId].init();
    }
    return this.instances[channelId];
  }

  static async getNoContext(systemMessage, hints) {
    return new ConversationContext(systemMessage, hints);
  }

  static endConversation(channelId) {
    if (this.instances[channelId]) {
      delete this.instances[channelId];
    }
  }

  constructor(channelId) {
    this.channelId = channelId;
    this.context = [];
    this.systemMessage = null;
  }

  // fetches system message and context from sqlite
  // TODO: use Promise.all to fetch both at the same time
  async init() {
    this.context = await this.loadContext();
    this.systemMessage = await this.loadSystemMessage();
  }

  async loadContext() {
    const channelId = this.channelId;

    // Fetch contextTimestamp from sqlite
    const channelRow = db.prepare(
      'SELECT context_timestamp FROM channels WHERE channel_id = ?'
    ).get(channelId);
    const contextTimestamp = channelRow?.context_timestamp || 0;

    // Fetch the most recent messages after the context timestamp
    const rows = db.prepare(`
      SELECT role, message AS content, name, tool_call_id, tool_calls
      FROM messages
      WHERE channel_id = ? AND timestamp > ?
      ORDER BY timestamp DESC, id DESC
      LIMIT ?
    `).all(channelId, contextTimestamp, CONTEXT_MESSAGES_LIMIT);

    const messages = rows.map((row) => {
      const data = {
        role: row.role,
        content: row.content,
      };

      if (row.name) {
        data.name = row.name;
      }

      if (row.tool_call_id) {
        data.tool_call_id = row.tool_call_id;
      }

      if (row.tool_calls) {
        data.tool_calls = JSON.parse(row.tool_calls);
      }

      return data;
    });

    return messages.reverse(); // Ensure the ordering is from oldest to newest
  }

  // loads the system message from sqlite and sets it if it exists
  async loadSystemMessage() {
    const row = db.prepare(
      'SELECT system_message FROM channels WHERE channel_id = ?'
    ).get(this.channelId);
    const systemMessage = row?.system_message || null;

    if (systemMessage) {
      return {
        role: 'system',
        content: systemMessage,
      };
    }

    return null;
  }

  // accepts a string, sets it as the system message and saves it to sqlite
  async setSystemMessage(systemMessage) {
    const systemMessageObj = {
      role: 'system',
      content: systemMessage,
    };
    this.systemMessage = systemMessageObj;

    // log the previous system message if there was one
    const previous = db.prepare(
      'SELECT system_message FROM channels WHERE channel_id = ?'
    ).get(this.channelId);
    if (previous?.system_message) {
      console.log('System Message:', previous.system_message);
    }

    // save system message to sqlite (upsert)
    db.prepare(`
      INSERT INTO channels (channel_id, system_message)
      VALUES (?, ?)
      ON CONFLICT(channel_id) DO UPDATE SET system_message = excluded.system_message
    `).run(this.channelId, systemMessage);
  }

  getSystemMessage() {
    return this.systemMessage?.content || defaultSystemMessage;
  }

  resetSystemMessage() {
    this.setSystemMessage('');
  }

  // adds a timestamp to channel metadata that indicates the oldest message that should be loaded into context
  async setContextTimestamp() {
    const channelId = this.channelId;

    // log the previous timestamp if there was one
    const previous = db.prepare(
      'SELECT context_timestamp FROM channels WHERE channel_id = ?'
    ).get(channelId);
    if (previous?.context_timestamp) {
      console.log('Context Timestamp:', previous.context_timestamp);
    }

    // Generate current timestamp
    const timestamp = Date.now();

    // Save context timestamp to sqlite (upsert)
    db.prepare(`
      INSERT INTO channels (channel_id, context_timestamp)
      VALUES (?, ?)
      ON CONFLICT(channel_id) DO UPDATE SET context_timestamp = excluded.context_timestamp
    `).run(channelId, timestamp);

    // Clear context
    this.context = [];
  }

  // clears the context timestamp from channel metadata and reloads context from sqlite
  async clearContextTimestamp() {
    const channelId = this.channelId;

    // log the previous timestamp if there was one
    const previous = db.prepare(
      'SELECT context_timestamp FROM channels WHERE channel_id = ?'
    ).get(channelId);
    if (previous?.context_timestamp) {
      console.log('Context Timestamp:', previous.context_timestamp);
    }

    // Reset context timestamp in sqlite (upsert)
    db.prepare(`
      INSERT INTO channels (channel_id, context_timestamp)
      VALUES (?, 0)
      ON CONFLICT(channel_id) DO UPDATE SET context_timestamp = 0
    `).run(channelId);

    // Reload context
    this.context = await this.loadContext();
  }


  // options: { toolCallId, toolCalls } — used for tool-calling (function calling)
  // - toolCallId: for role 'tool' results, ties the result back to a tool call
  // - toolCalls: for role 'assistant' messages that announce tool calls
  addMessage(role, userPrompt, originalMessage, functionName = null, options = {}) {
    const { toolCallId, toolCalls } = options;

    // messages can be from the user or the bot
    const isUserMessage = (role === 'user');

    const messageId = isUserMessage ? originalMessage.id : null;
    const member = isUserMessage ? originalMessage.author.id : null;
    const channelId = originalMessage.channelId;

    // get timestamp
    const timestamp = Date.now()

    // handle undefined and null function return values
    if (userPrompt === undefined) {
      userPrompt = 'undefined';
    }
    if (userPrompt === null && !toolCalls) {
      userPrompt = 'null';
    }

    const message = { role };

    if (role === 'assistant' && toolCalls) {
      // assistant message announcing tool calls — content must be null
      message.content = null;
      message.tool_calls = toolCalls;
    } else if (role === 'tool' || role === 'function') {
      // tool/function result messages must have plain string content
      message.content = userPrompt;
    } else {
      const content = [];
      content.push({ type: 'text', text: userPrompt });

      if (isUserMessage) {
        if (options.imageUrls?.length) {
          // pre-downloaded inline images (base64 data URLs) from gpt3.js
          for (const url of options.imageUrls) {
            content.push({ type: 'image_url', image_url: { url } });
          }
        } else {
          // fallback: pass attachment URLs directly (JPEG/PNG/GIF/WebP only)
          const supportedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
          if (originalMessage.attachments.size > 0) {
            originalMessage.attachments.forEach((attachment) => {
              const contentType = attachment.contentType || '';
              const isImage = supportedImageTypes.includes(contentType) ||
                /\.(jpe?g|png|gif|webp)$/i.test(attachment.url || '');
              if (isImage && attachment.url) {
                // trim whitespace / trailing '&' some CDNs leave in URLs
                const url = attachment.url.trim().replace(/&+$/, '');
                content.push({ type: 'image_url', image_url: { url } });
              }
            });
          }
        }
      }

      message.content = content;
    }

    if (role === 'function' && functionName) {
      message.name = functionName;
    }

    if (role === 'tool' && toolCallId) {
      message.tool_call_id = toolCallId;
    }

    const data = {
      id: messageId,
      member,
      channelId,
      role,
      message: userPrompt, // null for assistant tool_calls messages
      timestamp,
    };

    if (role === 'function' && functionName) {
      data.name = functionName;
    }

    if (role === 'tool' && toolCallId) {
      data.tool_call_id = toolCallId;
    }

    if (role === 'assistant' && toolCalls) {
      data.tool_calls = JSON.stringify(toolCalls);
    }
    
    this.context.push(message);
    this.#manageContextLength();

    // persist message to sqlite
    db.prepare(`
      INSERT INTO messages (message_id, member, channel_id, role, message, name, tool_call_id, tool_calls, timestamp)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.id,
      data.member,
      data.channelId,
      data.role,
      data.message,
      data.name ?? null,
      data.tool_call_id ?? null,
      data.tool_calls ?? null,
      data.timestamp
    );
  }

  getContext() {
    // if there is no system message, return default system message
    let systemMessage = this.systemMessage;
    if (!this.systemMessage) {
      systemMessage = {
        role: 'system',
        content: defaultSystemMessage,
      };
    }

    // remove expired image attachments
    this.#removeExpiredDiscordImageAttachements();

    return [systemMessage, ...this.context];
  }

  #manageContextLength = () => {
    // check total length of context
    const totalLength = this.context.reduce((acc, cur) => acc + (cur.content?.length || 0), 0);

    if (totalLength > CONTEXT_LENGTH) {
      // remove oldest context
      this.context.shift();

      // recursively check again
      this.#manageContextLength();
    }
  }

  #removeExpiredDiscordImageAttachements = () => {

    const hasExpiredUrl = (content) => {
      if (content.type !== 'image_url') {
        return false;
      }

      const url = content.image_url.url;

      if (!isDiscordCDN(url)) {
        return false;
      }

      // ex is the query parameter for expiration timestamp, hex encoded
      const hexExpirationTimestamp = getQueryParamValue(url, 'ex');

      if (!hexExpirationTimestamp) {
        return false;
      }

      const expirationTimestamp = hexToDecimal(hexExpirationTimestamp);

      if (!expirationTimestamp) {
        return false;
      }

      const currentTimestamp = Date.now();
      const currentTimestampSeconds = Math.floor(currentTimestamp / 1000);
      const isExpired = currentTimestampSeconds > expirationTimestamp;
      return isExpired;
    }

    // loop through content array of each message
    // if the content is an image_url and has expired, remove the message from context
    this.context.forEach((message) => {

      // if message.content is not an array, skip
      if (!Array.isArray(message.content)) {
        return;
      }

      message.content = message.content.filter((content) => {
        return !hasExpiredUrl(content);
      });
    });
  }
}

module.exports = ConversationContext;
