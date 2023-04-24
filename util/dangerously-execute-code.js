// accept a string of code and send it to the function to be executed

const JS_CODE_EXECUTION_ENDPOINT = process.env.JS_CODE_EXECUTION_ENDPOINT;
// Cloud Functions uses your function's url as the `targetAudience` value
const targetAudience = JS_CODE_EXECUTION_ENDPOINT;
// For Cloud Functions, endpoint (`url`) and `targetAudience` should be equal
const url = targetAudience;

GOOGLE_APPLICATION_CREDENTIALS = process.env.GOOGLE_APPLICATION_CREDENTIALS;
GCP_PROJECT_ID = process.env.GCP_PROJECT_ID;

const { GoogleAuth } = require('google-auth-library');
const options = {
  keyFilename: GOOGLE_APPLICATION_CREDENTIALS,
  projectId: GCP_PROJECT_ID,
};
const auth = new GoogleAuth(options);

async function request(code_to_execute) {
  // console.info(`request ${url} with target audience ${targetAudience}`);
  const client = await auth.getIdTokenClient(targetAudience);
  // console.info('client: ', client);
  const res = await client.request({url,
    method: 'POST',
    data: {
      code: code_to_execute,
    },
  });
  console.info('data: ', res.data?.result);
  return res.data?.result;
}

module.exports = {
  dangerouslyExecuteJS: request,
};
