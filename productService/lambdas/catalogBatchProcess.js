const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

module.exports.handler = async (event) => {
  const putRequests = event.Records.map((record) => {
    if (record && record.body) {
      const product = JSON.parse(record.body);

      const productId = uuidv4();

      return {
        PutRequest: {
          Item: {
            id: productId,
            title: product.title,
            description: product.description,
            price: product.price,
            count: product.count,
          },
        },
      };
    }
  });

  if (!putRequests || !putRequests.length) {
    console.log('No items to process');
    return;
  }

  try {
    const params = {
      RequestItems: {
        [process.env.productsTableName]: putRequests,
      },
    };

    await dynamoDB.batchWrite(params).promise();

    const message = `Successfully created ${putRequests.length} products`;
    const snsParams = {
      Subject: 'Product Creation',
      Message: message,
      TopicArn: process.env.topicArn,
    };
    await sns.publish(snsParams).promise();

    console.log(message);
  } catch (error) {
    console.log('Error processing items', error);
    throw error;
  }
};
