const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

console.log(AWS.VERSION);
const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

const Dynamo = {
  async getItem(ID, TableName) {
    const params = {
      TableName,
      Key: {
        id: ID,
      },
    };

    const data = await documentClient.get(params).promise();

    if (!data || !data.Item) {
      throw Error(`There was an error fetching the data for ID of ${ID} from ${TableName}`);
    }
    console.log(data);

    return data.Item;
  },

  async getStock(ID, TableName) {
    const params = {
      TableName,
      Key: {
        product_id: ID,
      },
    };

    const data = await documentClient.get(params).promise();

    if (!data || !data.Item) {
      throw Error(`There was an error fetching the data for ID of ${ID} from ${TableName}`);
    }
    console.log(data);

    return data.Item;
  },

  async scan(TableName) {
    const params = {
      TableName,
    };

    const data = await documentClient.scan(params).promise();
    if (!data || !data.Items) {
      throw Error(`There was an error scanning the data for ${TableName}`);
    }

    console.log(data);

    return data.Items;
  },
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
};

module.exports = Dynamo;
