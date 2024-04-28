const AWS = require('aws-sdk');
const csvParse = require('csv-parser');
const { once } = require('events');

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

module.exports.handler = async (event) => {
  try {
    const record = event.Records[0];
    const bucketName = record.s3.bucket.name;
    const objectKey = record.s3.object.key;

    if (!objectKey.startsWith('uploaded/')) {
      console.log('Object is not in the uploaded folder. Skipping...');
      return;
    }
    if (!objectKey.endsWith('.csv')) {
      console.log(`Non-CSV file "${record.s3.object.key}"`);
      return;
    }

    const s3Object = await s3.getObject({ Bucket: bucketName, Key: objectKey }).createReadStream();
    const dataArray = [];

    s3Object
      .pipe(csvParse())
      .on('data', async (data) => {
        // Check if data is empty before pushing to dataArray
        if (Object.keys(data).length !== 0) {
          dataArray.push(data);
        }
      })
      .on('error', (err) => {
        console.log('Error in CSV Parser:', err);
      })
      .on('end', async () => {
        console.log('Finished parsing CSV');
        try {
          // Send the entire array of data to SQS if dataArray is not empty
          if (dataArray.length > 0) {
            const params = {
              MessageBody: JSON.stringify(dataArray),
              QueueUrl: 'https://sqs.us-east-1.amazonaws.com/890188306865/catalogItemsQueue',
            };
            await sqs.sendMessage(params).promise();
            console.log('Message sent to SQS:', JSON.stringify(dataArray));
          } else {
            console.log('No data to send to SQS');
          }
        } catch (error) {
          console.error('Error sending message to SQS:', error);
        }
      });

    await once(s3Object, 'end');

    const targetKey = objectKey.replace('uploaded', 'parsed');
    await s3
      .copyObject({
        Bucket: bucketName,
        CopySource: `${bucketName}/${objectKey}`,
        Key: targetKey,
      })
      .promise();
    console.log(`Copied object to "${targetKey}"`);

    await s3
      .deleteObject({
        Bucket: bucketName,
        Key: objectKey,
      })
      .promise();
    console.log(`Deleted original object "${objectKey}"`);
  } catch (error) {
    console.error('Error processing S3 event:', error);
    throw error;
  }
};
