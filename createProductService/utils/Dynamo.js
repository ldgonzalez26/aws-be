const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });
const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

const Dynamo = {
  async writeProduct(data, TableName) {
    if (!data.id) {
      throw Error('No id on data');
    }
    const params = {
      TableName,
      Item: data,
    };

    const res = await documentClient.put(params).promise();

    if (!res) {
      throw Error(`there was an error inserting ${data.id} into table ${TableName}`);
    }

    return data;
  },
  async writeStock(data, TableName) {
    if (!data.product_id) {
      throw Error('No id on data');
    }
    const params = {
      TableName,
      Item: data,
    };

    const res = await documentClient.put(params).promise();

    if (!res) {
      throw Error(`there was an error inserting ${data.id} into table ${TableName}`);
    }

    return data;
  },
  async getItem(ID, TableName) {
    const params = {
      TableName,
      Key: {
        id: ID,
      },
    };

    const data = await documentClient.get(params).promise();

    if (!data || !data.Item) {
      return null;
    }
    console.log(data);

    return data.Item;
  },
};

module.exports = Dynamo;
