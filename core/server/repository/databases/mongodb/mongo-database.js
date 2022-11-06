'use strict';

const mongoose = require('mongoose');
const envVars = require('dotenv').config();
const { throwError } = require('../../../../validation/validation');
const NODE_ENV = process.env.NODE_ENV;
const MONGO_DB = process.env.MONGO_DB+'';
const { log, error } = require('../../../../../logging/logger/global-logger')(module);
!envVars && throwError(envVars);
MONGO_DB === '' && throwError(envVars);

NODE_ENV != 'production' && log(`Mongo Database = ${MONGO_DB}`);

let db = null;

const dbConnect = async () => {

  try {
    log('Connecting to Sneakers database (MonoDB).')
    db = await mongoose.connect(MONGO_DB, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useFindAndModify: false,
      useCreateIndex: true
    });
    db && log('Connected to Sneakers database (MongoDB).'.green);
    return db;
  } catch (e) {
      error('There was an error!');
      error(JSON.stringify(e.stack));
      throw e;
  }
};

const getConnection = async () => {
  db = await dbConnect();
  return db;
};

module.exports = getConnection;
