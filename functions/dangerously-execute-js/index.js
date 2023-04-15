const functions = require('@google-cloud/functions-framework');
const escapeHtml = require('escape-html');

/**
 * Responds to an HTTP request using data from the request body parsed according
 * to the "content-type" header.
 *
 * @param {Object} req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
functions.http('helloHttp', (req, res) => {

  // get the code to execute
  const code = req.body.code;

  console.log(req.body);
  // execute the code
  const output = eval(code);

  console.log({ result: output });

  // send the response
  res.send({result: output});

  // res.send(`Hello ${escapeHtml(req.query.name || req.body.name || 'World')}!`);
});
