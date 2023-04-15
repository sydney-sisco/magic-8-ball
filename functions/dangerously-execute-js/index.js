const functions = require('@google-cloud/functions-framework');

functions.http('helloHttp', async (req, res) => {

  // get the code to execute
  const code = req.body.code;

  console.log(req.body);
  
  try {
    // execute the code
    let output = eval(code);

    // Check if the output is a Promise and wait for it to resolve
    if (output instanceof Promise) {
      output = await output;
    }

    console.log({ result: output });

    // send the response
    res.send({ result: output });
  } catch (error) {
    console.error(`Error executing code: ${error.message}`);
    res.status(500).send({ error: error.message });
  }
});
