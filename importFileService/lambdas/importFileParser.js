const AWS = require('aws-sdk');
const Responses = require('../utils/API_Responses');
const s3 = new AWS.S3();

module.exports.handler = async (event) => {
  const fileName = event?.queryStringParameters?.name;

  if (!fileName) {
    return Responses._400({ message: 'Missing "name" query parameter' });
  }
  const path = `uploaded/${fileName}`;

  try {
    const signedUrl = await s3.getSignedUrlPromise('putObject', {
      Bucket: 'products-file',
      Key: path,
      Expires: 60,
      ContentType: 'text/csv',
    });

    const responseObj = {
      url: signedUrl,
    };
    return Responses._200(responseObj);
  } catch (error) {
    console.log('Error while generating signed url', error);
    return Responses._400({ message: 'Failed to generate signed url' });
  }
};
