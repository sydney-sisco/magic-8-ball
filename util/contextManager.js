const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();
const CONTEXT_LENGTH = process.env.OPENAI_CONTEXT_LENGTH || 1000;
const CONTEXT_MESSAGES_LIMIT = process.env.CONTEXT_MESSAGES_LIMIT || 10;

class ConversationContext {

  static instances = {};

  static async getConversation(channelId, systemMessage, hints) {
    if (!this.instances[channelId]) {
      this.instances[channelId] = new ConversationContext(systemMessage, hints, channelId);
      await this.instances[channelId].loadContextFromFirestore(channelId);
    }
    return this.instances[channelId];
  }

  static endConversation(channelId) {
    if (this.instances[channelId]) {
      delete this.instances[channelId];
    }
  }

  constructor(systemMessage, hints, channelId) {
    this.systemMessage = systemMessage;
    this.hints = hints;
    this.context = [];
    // this.#loadContextFromFirestore(channelId);
  }

  async loadContextFromFirestore(channelId) {
    const channelRef = firestore.collection(`channels/${channelId}/messages`);
    const snapshot = await channelRef.orderBy('timestamp', 'desc')
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

    this.context = messages.reverse(); // Ensure the ordering is from oldest to newest
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
    return [this.systemMessage, ...this.hints, ...this.context];
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
