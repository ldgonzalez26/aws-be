'use strict';

const Responses = require('../utils/API_Responses');
const Dynamo = require('../utils/Dynamo');
const productsTableName = process.env.productsTableName;
const stockTableName = process.env.stockTableName;

module.exports.handler = async () => {
  const products = await Dynamo.scan(productsTableName).catch((err) => {
    console.log(err, 'error in dynamo getProducts');
    return null;
  });
  const stocks = await Dynamo.scan(stockTableName).catch((err) => {
    console.log(err, 'error in dynamo getProducts::stocks');
    return null;
  });
  const joinedItems = products
    .map((item) => {
      const found = stocks.find((stock) => item.id === stock.product_id);
      if (found) {
        let joinItem = { ...item, count: found.count };
        return joinItem;
      }
    })
    .filter((item) => !!item);
  return Responses._200(joinedItems);

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};
