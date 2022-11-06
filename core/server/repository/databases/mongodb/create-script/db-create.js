const mongodb= require('../mongo-database');
const mongoose = require('mongoose');

const { log } = require('../../../../../../logging/logger/global-logger')(module);

const exists = async (collectionName) => {
  new Promise((resolve, reject) => {
    mongoose.connection.db.listCollections().toArray((err, names) => {
      err && reject(err);
      log(names);
      const exists = names.map(collection => collection.colectionName)
        .filter(name => name === collectionName)
        .length > 0;
      exists && log(`${collectionName} already exists in the Sneakers Database.`)
      resolve(exists);
    });
  })
}

const recreateSchema = ['server_log_entries'];


mongodb().then((db) => {
  log('Creating collections Registry, Secrets, Log Entries, and Server Data');
    (async () => {
     
      let recreate = recreateSchema.includes('registry');
        if (recreate) 
        try {
          log('Dropping registry collection.')
          await db.connection.dropCollection('registry');
        } catch(e) { 

        }
    
      recreate && 
      log('Creating registry collection.') &&
      await db.connection.createCollection('registry', {
        capped: false,
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            title: 'Registry',
            properties: {
              _id: {
                bsonType: 'objectId'
              },
              endPoints: {
                bsonType: 'array',
                additionalItems: true,
                allOf: [
                  {
                    bsonType: 'array',
                    additionalItems: true,
                    uniqueItems: true
                  }
                ]
              },
              ipAddress: {
                bsonType: 'string'
              },
              name: {
                bsonType: 'string'
              },
              port: {
                bsonType: 'int'
              },
              status: {
                bsonType: 'string'
              },
              createdAt: {
                bsonType: 'date'
              },
              updatedAt: {
                bsonType: 'date'
              },
              __v: {
                bsonType: 'int'
              }
            },
            additionalProperties: true,
            required: [
              '_id',
              'endPoints',
              'ipAddress',
              'name',
              'port',
              'status',
              'createdAt',
              'updatedAt',
              '__v'
            ],
            dependencies: {
              endPoints: ['_id', 'ipAddress']
            }
          }
        },
        validationLevel: 'off',
        validationAction: 'warn'
      });

      recreate = recreateSchema.includes('secrets');
      if (recreate) 
      try {
        log('Dropping secrets collection.')
        await db.connection.dropCollection('secret');
      } catch(e) { 

      }
  
      recreate && 
      log('Creating secrets collection') && 
      await db.connections[0].createCollection('secrets', {
        capped: false,
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            title: 'Secrets',
            properties: {
              _id: {
                bsonType: 'objectId'
              },
              id: {
                bsonType: 'objectId'
              },
              password: {
                bsonType: 'string'
              },
              accessToken: {
                bsonType: 'string'
              },
              accessTokenSecret: {
                bsonType: 'string'
              },
              refreshToken: {
                bsonType: 'string'
              },
              refreshTokenSecret: {
                bsonType: 'string'
              },
              lastAccess: {
                bsonType: 'date'
              },
              createdAt: {
                bsonType: 'date'
              },
              updatedAt: {
                bsonType: 'date'
              },
              _v: {
                bsonType: 'number'
              }
            },
            additionalProperties: true,
            required: ['_id', 'id', 'password', '_v'],
            dependencies: {
              password: ['_id', 'id'],
              accessToken: ['password'],
              accessTokenSecret: ['accessToken'],
              refreshToken: ['accessToken', '_id', 'id', 'password'],
              refreshTokenSecret: ['refreshToken'],
              lastAccess: ['_id', 'id']
            }
          }
        },
        validationLevel: 'off',
        validationAction: 'warn'
      });

      recreate = recreateSchema.includes('server_log_entries');
      if (recreate) 
      try {
        log('Dropping server_log_entries collection.')
        await db.connection.dropCollection('server_log_entries');
      } catch(e) { 
        error('Problem dropping collection');
        error(JSON.stringify(e.stack, null, 2));
      }

      recreate && 
      log('Creating server_log_entries collection.') &&
      await db.connections[0].createCollection('server_log_entries', {
        capped: false,
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            title: 'Server Log Entries',
            properties: {
              _id: {
                bsonType: 'objectId'
              },
              timestamp: {
                bsonType: 'date'
              },
              hostIp: {
                bsonType: 'string'
              },
              clientIp: {
                bsonType: 'string'
              },
              phase: {
                bsonType: 'string'
              },
              logLevel: {
                bsonType: 'string'
              },
              module: {
                bsonType: 'string'
              },
              message: {
                bsonType: 'string'
              },
              traceId: {
                bsonType: 'string'
              },
              timeSinceLastLogEntry: {
                bsonType: 'number'
              },
              serverName: {
                bsonType: 'string'
              },
              createdAt: {
                bsonType: 'date'
              },
              __v: {
                bsonType: 'int'
              }
            },
            additionalProperties: false,
            required: ['_id', 'timestamp', 'module', 'message', '__v', 'serverName'],
            dependencies: {
              timestamp: ['_id'],
              hostIp: ['_id', 'timestamp'],
              clientIp: ['hostIp'],
              phase: ['hostIp'],
              logLevel: ['hostIp'],
              module: ['hostIp'],
              message: ['hostIp'],
              traceId: ['hostIp'],
              timeSinceLastLogEntry: ['hostIp']
            }
          }
        },
        validationLevel: 'off',
        validationAction: 'warn'
      });

      recreate = recreateSchema.includes('server_health_data');
      if (recreate) 
      try {
        log('Dropping server_health_data collection.')
        await db.connection.dropCollection('server_health_data');
      } catch(e) { 

      }
      
      recreate && 
      recreateSchema.includes('server_health_data') && 
      log('Creating Server_health_data') &&
      await db.connections[0].createCollection('server_health_data', {
        capped: false,
        validator: {
          $jsonSchema: {
            bsonType: 'object',
            title: 'Server Data',
            properties: {
              _id: {
                bsonType: 'objectId'
              },
              ipAddress: {
                bsonType: 'string'
              },
              data: {
                bsonType: 'object',
                properties: {
                  date: {
                    bsonType: 'date'
                  },
                  requestCount: {
                    bsonType: 'int'
                  },
                  errorCount: {
                    bsonType: 'int'
                  },
                  memory: {
                    bsonType: 'number'
                  },
                  diskSpace: {
                    bsonType: 'number'
                  }
                },
                additionalProperties: false,
                required: [
                  'date',
                  'requestCount',
                  'errorCount',
                  'memory',
                  'diskSpace'
                ]
              },
              createdAt: {
                bsonType: 'date'
              },
              updatedAt: {
                bsonType: 'date'
              },
              __v: {
                bsonType: 'int'
              }
            },
            additionalProperties: false,
            required: ['_id', 'ipAddress', 'data', '__v'],
            dependencies: {
              data: ['_id', 'ipAddress']
            }
          }
        },
        validationLevel: 'off',
        validationAction: 'warn'
      });
      //-----------SERVER DATA INDICES--------->
      log('Creating registry indicies');
      await db.connections[0].collection('registry').createIndex(
        {
          _id: 1
        },
        {
          name: '_id_'
        }
      );
      await db.connections[0].collection('registry').createIndex(
        {
          url: 1
        },
        {
          name: 'url_1',
          unique: true
        }
      );
      await db.connections[0].collection('registry').createIndex(
        {
          ipAddress: 1,
          name: 1,
          port: 1,
          status: 1
        },
        { name: 'unique_srv', background: true, unique: true }
      );
      //-----------SECRETS INDICES--------->
      log('Creating secrets indicies.');
      await db.connections[0].collection('secrets').createIndex(
        {
          _id: 1
        },
        {
          name: '_id_'
        }
      );
      await db.connections[0].collection('secrets').createIndex(
        {
          id: 1
        },
        {
          name: 'id_3',
          unique: true
        }
      );
      await db.connections[0].collection('secrets').createIndex(
        {
          password: 1
        },
        {
          name: 'password_1',
          background: true,
          unique: true
        }
      );
      await db.connections[0].collection('secrets').createIndex(
        {
          accessToken: 1
        },
        {
          name: 'accessToken_1',
          background: true,
          unique: true
        }
      );
      await db.connections[0].collection('secrets').createIndex(
        {
          refreshToken: 1
        },
        {
          name: 'refreshToken_1',
          background: true,
          unique: true
        }
      );
      await db.connections[0].collection('secrets').createIndex(
        {
          accessTokenSecret: 1
        },
        {
          name: 'accessTokenSecret_1',
          background: true,
          unique: true
        }
      );
      await db.connections[0].collection('secrets').createIndex(
        {
          refreshTokenSecret: 1
        },
        {
          name: 'refreshTokenSecret',
          background: true,
          unique: true
        }
      );
      //-----------SERVER DATA INDICES--------->
      log('Creating server data indicies.');
      await db.connections[0].collection('server_health_data').createIndex(
        {
          _id: 1
        },
        {
          name: '_id_'
        }
      );
      await db.connections[0].collection('server_health_data').createIndex(
        {
          id: 1
        },
        {
          name: 'id_1',
          unique: true
        }
      );
      await db.connections[0].collection('server_health_data').createIndex(
        {
          ipAddress: 1
        },
        {
          name: 'ipAddress_2',
          background: true,
          unique: true
        }
      );
      //-----------SERVER LOG INDICES--------->
      log('Creating server log indicies.');
      await db.connections[0].collection('server_log_entries').createIndex(
        {
          _id: 1
        },
        {
          name: '_id_'
        }
      );
      await db.connections[0].collection('server_log_entries').createIndex(
        {
          traceId: 1
        },
        {
          name: '_traceId_1'
        }
      );
      //-----------REGISTRY INDICES--------->
      log('Creating registry indicies.');
      await db.connections[0].collection('registry').createIndex(
        {
          _id: 1
        },
        {
          name: '_id_'
        }
      );
      await db.connections[0].collection('registry').createIndex(
        {
          ipAddress: 1
        },
        {
          name: 'ipAddress_1',
          background: true,
          unique: true
        }
      );
      await db.connections[0].collection('registry').createIndex(
        {
          name: 1
        },
        {
          name: 'name_1',
          background: true,
          unique: true
        }
      );
      await db.connections[0].collection('registry').createIndex(
        {
          hostIp: 1,
          port: 1
        },
        {
          name: 'hostId_port',
          background: true,
          unique: true
        }
      );
      log('Sneakers schema created');
      await db.connections[0].close();
  })();
});

