// Imports your configured client and any necessary S3 commands.
// import { ListBucketsCommand } from "@aws-sdk/client-s3";
// import { s3Client } from "./s3Client.js";

async function main(args) {
  let name = args.name || 'stranger'
  let greeting = 'Hello ' + name + '!'
  console.log(greeting)
  return { "body": greeting }
}

module.exports.main = main
