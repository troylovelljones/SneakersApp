'use strict';

const mongoose = require('mongoose');
const colors = require('colors');
const { error, log, getModuleLoggingMetaData } =
  require('../../../../../../logging/logger/global-logger')(module);

const createModel = (name, createSchema) => {
  log(`Model name = ${name}`);
  for (const modelName of mongoose.modelNames())
    if (modelName === name) {
      const model = mongoose.model(name);
      log(`Using existing ${name} model`.green);
      return model;
    }
  const model = mongoose.model(name, createSchema(), name);
  model && log('Created new schema.'.green);
  !model && error(`Unable to create ${name} schema!`.toUpperCase());
  return model;
};

const getModel = async (name, createSchema) => {
  try {
    const result = createModel(name, createSchema);
    result && log(`${name} schema created!`);
    return result;
  } catch (e) {
      error(JSON.stringify(e.stack));
      throw new Error(`Could not access the ${name} schema!`.red);
  }
};
module.exports = { getModel, getModuleLoggingMetaData };
