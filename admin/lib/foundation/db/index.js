'use strict';

var AWS = require('aws-sdk'),
    Bluebird = require('bluebird');

var tables = require('./tables'),
    configureAws = require('./../../util/helper').configureAws;

function createTable(method, table) {
  console.info('Creating table ' + table.name);

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

  return method(params);
}

function createResources(context) {
  configureAws(AWS);

  var dynamoDb = new AWS.DynamoDB();
  var awsDescribeTable = Bluebird.promisify(dynamoDb.describeTable, { context: dynamoDb });
  var awsCreateTable = Bluebird.promisify(dynamoDb.createTable, { context: dynamoDb });

  return Bluebird.each(tables, function(table) {
      return Bluebird.resolve()
        .then(function() {
            return awsDescribeTable({ TableName: table.name });
          })
        .then(function(tableDescription) {
            console.info('Table ' + table.name + ' already exists');
          })
        .catch(function(err) {
            switch(err.statusCode) {
              case 400: {
                return createTable(awsCreateTable, table);
              }
            }
          });
    });
}

function deleteTable(method, table) {
  console.info('Deleting table ' + table.name);

  var params = {
    TableName: table.name
  };

  return method(params);
}

function deleteResources(context) {
  configureAws(AWS);

  var dynamoDb = new AWS.DynamoDB();
  var awsDeleteTable = Bluebird.promisify(dynamoDb.deleteTable, { context: dynamoDb });

  return Bluebird.each(tables, function(table) {
        deleteTable(awsDeleteTable, table);
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