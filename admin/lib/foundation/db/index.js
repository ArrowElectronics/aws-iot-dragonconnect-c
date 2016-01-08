'use strict';

var AWS = require('aws-sdk'),
    Bluebird = require('bluebird');

var tables = require('./tables'),
    configureAws = require('./../../util/helper').configureAws;

function createTable(dynamoDb, table) {
  console.info('Creating table ' + table.name);

  var awsCreateTable = Bluebird.promisify(dynamoDb.createTable, { context: dynamoDb });

  var params = {
    TableName: table.name,
    KeySchema: [
      {
        AttributeName: table.hashKey.name,
        KeyType: 'HASH'
      }
    ],
    AttributeDefinitions: [
      {
        AttributeName: table.hashKey.name,
        AttributeType: table.hashKey.type
      }
    ],
    ProvisionedThroughput: table.throughput
  };

  if (table.rangeKey) {
    params.KeySchema.push(
      {
        AttributeName: table.rangeKey.name,
        KeyType: 'RANGE'
      }
    );

    params.AttributeDefinitions.push(
      {
        AttributeName: table.rangeKey.name,
        AttributeType: table.rangeKey.type
      }
    );
  }

  return awsCreateTable(params);
}

function createResources(context) {
  configureAws(AWS);

  var dynamoDb = new AWS.DynamoDB();
  var awsDescribeTable = Bluebird.promisify(dynamoDb.describeTable, { context: dynamoDb });

  return Bluebird.each(tables, function(table) {
    return awsDescribeTable({ TableName: table.name })
        .then(function(tableDescription) {
            console.info('Table ' + table.name + ' already exists');
          })
        .catch(function(err) {
            switch(err.statusCode) {
              case 400: {
                return createTable(dynamoDb, table);
              }
            }

            throw err;
          });
    });
}

function deleteTable(dynamoDb, table) {
  var awsDeleteTable = Bluebird.promisify(dynamoDb.deleteTable, { context: dynamoDb });

  var params = {
    TableName: table.name
  };

  return awsDeleteTable(params)
    .then(function() {
        console.info('Deleting table ' + table.name);
      })
    .catch(function(err) {
      if (err.code !== 'ResourceNotFoundException') {
        throw err;
      }
    });
}

function deleteResources(context) {
  configureAws(AWS);

  var dynamoDb = new AWS.DynamoDB();

  return Bluebird.each(tables, function(table) {
        deleteTable(dynamoDb, table);
      })
    .catch(function(err) {
        throw err;
      });
}

var manage = function(cmd, context) {
  switch(cmd) {
    case 'create':
      return createResources(context);
      break;
    case 'delete':
      return deleteResources(context);
      break;
    default:
      throw new TypeError('Unknown command of ' + cmd);
  }
};

module.exports = manage;