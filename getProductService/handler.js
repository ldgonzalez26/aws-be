'use strict';

const Responses = require('./utils/API_Responses');
const Dynamo = require('./utils/Dynamo');
const productsTableName = process.env.productsTableName;
const stockTableName = process.env.stockTableName;

module.exports.getProductsById = async (event) => {
  if (!event.pathParameters || !event.pathParameters.productId) {
    return Responses._400({ message: 'missing ID from the path' });
  }

  let Id = event.pathParameters.productId;
  const item = await Dynamo.getItem(Id, productsTableName).catch((err) => {
    console.log(err, 'error in dynamo getProductById');
    return null;
  });
  if (item) {
    const stock = await Dynamo.getStock(Id, stockTableName).catch((err) => {
      console.log(err, 'error in dynamo getProductById');
      return null;
    });
    if (stock) {
      item.count = stock.count;
      return Responses._200(item);
    } else {
      item.count = 0;
      return Responses._200(item);
    }
  }

  return Responses._400({ message: 'Product not found' });

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
