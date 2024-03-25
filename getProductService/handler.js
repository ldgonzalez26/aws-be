'use strict';

const Responses = require('./utils/API_Responses');
const ProductsList = require('./mocks/ProductListMock');

module.exports.getProductsById = async (event) => {
  if (!event.pathParameters || !event.pathParameters.productId) {
    return Responses._400({ message: 'missing ID from the path' });
  }

  let Id = event.pathParameters.productId;
  let item = ProductsList.find((item) => item.id === Id);
  if (item) {
    return Responses._200(item);
  }

  return Responses._400({ message: 'Product not found' });

  // Use this code if you don't use the http event with the LAMBDA-PROXY integration
  // return { message: 'Go Serverless v1.0! Your function executed successfully!', event };
};