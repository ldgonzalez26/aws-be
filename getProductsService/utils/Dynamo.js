const AWS = require('aws-sdk');
AWS.config.update({ region: 'us-east-1' });

console.log(AWS.VERSION);
const documentClient = new AWS.DynamoDB.DocumentClient({ apiVersion: '2012-08-10' });

const Dynamo = {
  async scan(TableName) {
    const params = {
      TableName,
    };

    const data = await documentClient.scan(params).promise();
    if (!data || !data.Items) {
      throw Error(`There was an error scanning the data for ${TableName}`);
    }

    return data.Items;
  },
};

module.exports = Dynamo;
