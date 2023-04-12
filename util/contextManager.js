const { Firestore } = require('@google-cloud/firestore');
const firestore = new Firestore();
const CONTEXT_LENGTH = process.env.OPENAI_CONTEXT_LENGTH || 1000;

class ConversationContext {
  constructor(systemMessage, hints) {
    this.systemMessage = systemMessage;
    this.hints = hints;
    this.context = [];
  }

    // ('user', userPrompt, message.id, member, message.channelId);
    addMessage(role, content, id, member, channelId) {

      // get timestamp
      const timestamp = new Date().toISOString();

      const message = {
        role,
        content,
      };
      
      this.context.push(message);
      this.#manageContextLength();

      const document = firestore.doc(`messages/${timestamp}`);

      // Enter new data into the document.
      document.set({
        id,
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
