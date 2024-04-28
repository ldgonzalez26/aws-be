const AWS = require('aws-sdk');
const csvParse = require('csv-parse');
const s3 = new AWS.S3();
const { once } = require('events');
const sqs = new AWS.SQS();

module.exports.handler = async (event) => {
  try {
    // Retrieve the last S3 bucket and key from the event
    const record = event.Records[0];
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;

    // Check if the object is in the 'uploaded' folder
    if (!objectKey.startsWith('uploaded/')) {
      console.log('Object is not in the uploaded folder. Skipping...');
      return;
    }
    if (!objectKey.endsWith('.csv')) {
      console.log(`non-CSV file "${record.s3.object.key}"`);
      return;
    }
    // Retrieve the object from S3
    const s3Object = await s3.getObject({ Bucket: bucketName, Key: objectKey }).promise();

    s3Object
      .createReadStream()
      .pipe(csvParse())
      .on('data', async (data) => {
        try {
          const params = {
            MessageBody: JSON.stringify(data),
            QueueUrl: 'https://sqs.us-east-1.amazonaws.com/890188306865/catalogItemsQueue',
          };
          await sqs.sendMessage(params).promise();
        } catch (error) {
          console.error('Error sending message to SQS:', error);
        }
      })
      .on('error', (err) => {
        console.log('Error in CSV Parser:', err);
      })
      .on('end', () => {
        console.log('Finished');
      });
    // wait for the s3Object upload to finish
    try {
      await once(s3Object, 'end'); // Corrected line
    } catch (err) {
      console.error(`Failed to process "${record.s3.object.key}": ${err}`);
    }

    try {
      const targetKey = record.s3.object.key.replace('uploaded', 'parsed');
      await s3
        .copyObject({
          Bucket: record.s3.bucket.name,
          CopySource: `${record.s3.bucket.name}/${record.s3.object.key}`,
          Key: targetKey,
        })
        .promise();
      console.log(`Copied object to "${targetKey}"`);

      await s3
        .deleteObject({
          Bucket: record.s3.bucket.name,
          Key: record.s3.object.key,
        })
        .promise();
      console.log(`Deleted original object "${record.s3.object.key}"`);
    } catch (copyError) {
      console.log('Error while copying object: ', copyError);
    }
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
