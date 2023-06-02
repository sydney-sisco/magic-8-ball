const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();
const CONTEXT_LENGTH = process.env.OPENAI_CONTEXT_LENGTH || 1000;
const CONTEXT_MESSAGES_LIMIT = process.env.CONTEXT_MESSAGES_LIMIT || 10;

const defaultSystemMessage = `You are a helpful Discord bot written in NodeJS v16. Please try to answer as concisely as possible. Your messages must be fewer than 2000 characters.`;

class ConversationContext {

  static instances = {};

  // returns a ConversationContext instance for the given channelId
  static async getConversation(channelId) {
    
    // if the context is not in memory, try loading it from firestore
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

  // fetches system message and context from firestore
  // TODO: use Promise.all to fetch both at the same time
  async init() {
    this.context = await this.loadContextFromFirestore();
    this.systemMessage = await this.loadSystemMessageFromFirestore();
  }

  async loadContextFromFirestore() {
    const channelId = this.channelId;

    // Fetch contextTimestamp from Firestore
    const docRef = firestore.doc(`channels/${channelId}`);
    const docSnapshot = await docRef.get();
    const contextTimestamp = docSnapshot.get('contextTimestamp') || 0;

    const channelRef = firestore.collection(`channels/${channelId}/messages`);
    const snapshot = await channelRef
      .orderBy('timestamp', 'desc')
      .where('timestamp', '>', contextTimestamp) // Filter messages by timestamp
      .limit(CONTEXT_MESSAGES_LIMIT)
      .get();

    const messages = [];
    snapshot.forEach(doc => {
      const data = {
        role: doc.get('role'),
        content: doc.get('message'),
      };
      messages.push(data);
    });

    return messages.reverse(); // Ensure the ordering is from oldest to newest
  }

  // loads the system message from firestore and sets it if it exists
  async loadSystemMessageFromFirestore() {
    const channelId = this.channelId;
    const docSnapshot = await firestore.doc(`channels/${channelId}`).get();
    const systemMessage = docSnapshot.exists ? docSnapshot.get('systemMessage') : null;

    if (systemMessage) {
      return {
        role: 'system',
        content: systemMessage,
      };
    }

    return null;
  }

  // accepts a string, sets it as the system message and saves it to firestore
  async setSystemMessage(systemMessage) {
    const systemMessageObj = {
      role: 'system',
      content: systemMessage,
    };
    this.systemMessage = systemMessageObj;

    // save system message to firestore
    const docRef = firestore.doc(`channels/${this.channelId}`);
    const docSnapshot = await docRef.get();
    if (docSnapshot.exists) {
      const systemMessage = docSnapshot.get('systemMessage');
      console.log('System Message:', systemMessage);
    }

    // save system message to firestore
    docRef.set({
      systemMessage,
    });
  }

  getSystemMessage() {
    return this.systemMessage?.content || defaultSystemMessage;
  }

  resetSystemMessage() {
    this.setSystemMessage('');
  }

  // adds a timestamp to channel metadata that indicates the oldest message that should be load loaded into context
  async setContextTimestamp() {
    const channelId = this.channelId;
    const docRef = firestore.doc(`channels/${channelId}`);
    const docSnapshot = await docRef.get();
    if (docSnapshot.exists) {
      const contextTimestamp = docSnapshot.get('contextTimestamp');
      console.log('Context Timestamp:', contextTimestamp);
    }

    // Generate current timestamp
    const timestamp = Date.now();

    // Save context timestamp to Firestore
    if (docSnapshot.exists) {
      docRef.update({
        contextTimestamp: timestamp,
      });
    } else {
      docRef.set({
        contextTimestamp: timestamp,
      });
    }

    // Clear context
    this.context = [];
  }

  // clears the context timestamp from channel metadata and reloads context from firestore
  async clearContextTimestamp() {
    const channelId = this.channelId;
    const docRef = firestore.doc(`channels/${channelId}`);
    const docSnapshot = await docRef.get();
    if (docSnapshot.exists) {
      const contextTimestamp = docSnapshot.get('contextTimestamp');
      console.log('Context Timestamp:', contextTimestamp);
    }


    // Update context timestamp to firestore
    if (docSnapshot.exists) {
      docRef.update({
        contextTimestamp: 0,
      });
    } else {
      docRef.set({
        contextTimestamp: 0,
      });
    }

    // Reload context
    this.context = await this.loadContextFromFirestore();
  }


  addMessage(role, content, originalMessage) {

    const messageId = role == 'user' ? originalMessage.id : null;
    const member = role == 'user' ? originalMessage.member.id : null;
    const channelId = originalMessage.channelId;

    // get timestamp
    const timestamp = Date.now()

    const message = {
      role,
      content,
    };
    
    this.context.push(message);
    this.#manageContextLength();

    const document = firestore.doc(`channels/${channelId}/messages/${timestamp}`);

    // Enter new data into the document.
    document.set({
      id: messageId,
      member,
      channelId,
      role,
      message: content,
      timestamp,
    });
  }

  getContext() {
    // return [this.systemMessage, ...this.hints, ...this.context];

    const context = this.context;

    // if there is no system message, return default system message
    let systemMessage = this.systemMessage;
    if (!this.systemMessage) {
      systemMessage = {
        role: 'system',
        content: defaultSystemMessage,
      };
    }

    return [systemMessage, ...this.context];
  }

  #manageContextLength = () => {
    // check total length of context
    const totalLength = this.context.reduce((acc, cur) => acc + cur.content.length, 0);

    if (totalLength > CONTEXT_LENGTH) {
      // remove oldest context
      this.context.shift();

      // recursively check again
      this.#manageContextLength();
    }
  }
}

module.exports = ConversationContext;
