'use strict';

module.exports.handler = async (event) => {
  try {
    const token = event.authorizationToken;
    const methodArn = event.methodArn;
    console.log('event', event);
    console.log('token', token);
    console.log('methodArn', methodArn);
    if (!token) {
      return generateUnauthorizedResponse();
    }

    const [type, credentials] = event.authorizationToken.split(' ');

    if (type !== 'Basic') {
      return generateUnauthorizedResponse();
    }

    const buff = Buffer.from(credentials, 'base64');
    const [username, password] = buff.toString('utf-8').split(':');

    console.log('Username and password', username, password);
    //"bGRnb256YWxlem1lZGluYTI2OlRFU1RfUEFTU1dPUkQ="
    const storedUserPassword = process.env.GITHUB_ACCOUNT_LOGIN;

    console.log('storedUserPassword', storedUserPassword);
    const effect = storedUserPassword !== password ? 'Deny' : 'Allow';
    return generateAuthResponse(credentials, effect, methodArn);
  } catch (error) {
    return generateForbiddenResponse();
  }
};

// Function to generate 401 Unauthorized response
function generateUnauthorizedResponse() {
  return {
    statusCode: 401,
    body: JSON.stringify({ message: 'Unauthorized' }),
  };
}

// Function to generate 403 Forbidden response
function generateForbiddenResponse() {
  return {
    statusCode: 403,
    body: JSON.stringify({ message: 'Forbidden' }),
  };
}

function generateAuthResponse(principalId, effect, methodArn) {
  const policyDocument = generatePolicyDocument(effect, methodArn);
  return {
    principalId,
    policyDocument,
  };
}

function generatePolicyDocument(effect, methodArn) {
  if (!effect || !methodArn) {
    return null;
  }
  const policyDocument = {
    Version: '2012-10-17',
    Statement: [
      {
        Action: 'execute-api:Invoke',
        Effect: effect,
        Resource: methodArn,
      },
    ],
  };

  return policyDocument;
}
