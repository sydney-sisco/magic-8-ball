// accept a string of code and send it to the function to be executed

// Cloud Functions uses your function's url as the `targetAudience` value
const targetAudience = 'https://us-central1-magic-8-ball-381203.cloudfunctions.net/helloHttp';
// For Cloud Functions, endpoint (`url`) and `targetAudience` should be equal
const url = targetAudience;


const { GoogleAuth } = require('google-auth-library');
const options = {
  keyFilename: 'gcp.json',
  projectId: 'magic-8-ball-381203',
};
const auth = new GoogleAuth(options);

async function request(code_to_execute) {
  // console.info(`request ${url} with target audience ${targetAudience}`);
  const client = await auth.getIdTokenClient(targetAudience);
  // console.info('client: ', client);
  const res = await client.request({url,
    method: 'POST',
    data: {
      // code: 'const arr = [1, 2, 3]; arr.map(x => x * 2)',
      code: code_to_execute,
    },
  });
  console.info('data: ', res.data);
  return res.data?.result;
}

// request().catch(err => {
//   console.error('err: ', err.message);
//   process.exitCode = 1;
// });

module.exports = {
  dangerouslyExecuteJS: request,
};
