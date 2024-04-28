const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');

const dynamoDB = new AWS.DynamoDB.DocumentClient();
const sns = new AWS.SNS();

module.exports.handler = async (event) => {
  const items = event.Records.map((record) => {
    if (record && record.body) {
      const products = JSON.parse(record.body);
      const productItems = products.map((product) => {
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
      });

      return productItems;
    }
  }).flat();

  if (!items || !items.length) {
    console.log('No items to process');
    return;
  }

  const productParamsItems = items.map((item) => {
    const { PutRequest } = item;
    const { Item } = PutRequest;
    const { count, ...rest } = Item;
    return { PutRequest: { Item: rest } };
  });

  const countItems = items.map((item) => {
    const { Item } = item.PutRequest;
    return {
      PutRequest: {
        Item: {
          count: Item.count,
          product_id: Item.id,
        },
      },
    };
  });

  try {
    const productParams = {
      RequestItems: {
        [process.env.productsTableName]: productParamsItems,
      },
    };
    const stockParams = {
      RequestItems: {
        [process.env.stockTableName]: countItems,
      },
    };

    await dynamoDB.batchWrite(productParams).promise();
    await dynamoDB.batchWrite(stockParams).promise();
    const message = `Successfully created ${items.length} products`;
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
