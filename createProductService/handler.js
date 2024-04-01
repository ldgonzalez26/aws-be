'use strict';

const Responses = require('./utils/API_Responses');
const Dynamo = require('./utils/Dynamo');
const productsTableName = process.env.productsTableName;
const stockTableName = process.env.stockTableName;

//should be implemented for extra points
//research transactions for extra points

const validateData = (product) => {};
module.exports.createProduct = async (event) => {
  const product = event.body;
  console.log(event.body);
  const item = await Dynamo.getItem(product.id, productsTableName).catch((err) => {
    console.log(err, 'error in dynamo getProductById');
    return null;
  });
  if (item) {
    return Responses._400({ message: 'Product already exist' });
  }
  let { count, ...rest } = product;
  const newProduct = await Dynamo.writeProduct(rest, productsTableName).catch((err) => {
    console.log('error in dynamo write', err);
    return null;
  });
  if (!newProduct) {
    return Responses._400({ message: 'Failed to write product by ID' });
  }
  let parsedStock = { product_id: product.id, count: count };
  const newStock = await Dynamo.writeStock(parsedStock, stockTableName).catch((err) => {
    console.log('error in dynamo write', err);
    return null;
  });
  if (!newStock) {
    return Responses._400({ message: 'Failed to write stock by ID' });
  }
  return Responses._200({ message: 'Product sucessfully inserted' });
};
