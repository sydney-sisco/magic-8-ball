const ConversationContext = require('../util/contextManager.js');

describe('ConversationContext', () => {
  const systemMessages = [
    {
      role: 'default',
      shortName: 'default',
      systemMessage:
      {
        role: 'system',
        content: `You are a helpful Discord bot written in NodeJS v16. Please try to answer as concisely as possible. Your messages must be fewer than 2000 characters.`,
      },
      hints: [],
    },
  ];
    
  test('Test 1', () => {
    const input = '';
    const expected = '';
    expect(input).toEqual(expected);
  });

  test('getNoContext should return no context', async () => {
    const context = systemMessages.find(sm => sm.shortName === 'default')
    conversation = await ConversationContext.getNoContext(context.systemMessage, context.hints);
  });

  // test('saveData and fetchData methods should work together', async () => {
  //   const yourClass = new YourClass();
  //   const dataToSave = { key: 'valueToSave' }; // Replace with your test data
  //   const docPath = 'myDocumentPath'; // Replace with your document path

  //   // Assuming your class has a saveData method that takes the docPath and dataToSave
  //   await expect(yourClass.saveData(docPath, dataToSave)).resolves.not.toThrow();

  //   // Set up the fetchData method to return only data,
  //   // assuming it usually returns exists and data separately.
  //   yourClass.fetchData = async (docPath) => {
  //     const { exists, data } = await yourClass.fetchData(docPath);
  //     return exists ? data() : null;
  //   };

  //   const retrievedData = await yourClass.fetchData(docPath);
  //   expect(retrievedData).toEqual(dataToSave);
  // });
});
