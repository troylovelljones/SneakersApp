'use strict';

const mongoose = require('mongoose');
const colors = require('colors');
const { error, debug, getModuleLoggingMetaData } =
  require('../../../../../../logging/logger/global-logger')(module);

const createModel = (name, createSchema) => {
  debug(`Model name = ${name}`);
  for (const modelName of mongoose.modelNames())
    if (modelName === name) {
      const model = mongoose.model(name);
      debug(`Using existing ${name} model`.green);
      return model;
    }
  const model = mongoose.model(name, createSchema(), name);
  model && debug('Created new schema.'.green);
  !model && error(`Unable to create ${name} schema!`.toUpperCase());
  return model;
};

const getModel = async (name, createSchema) => {
  try {
    const result = createModel(name, createSchema);
    result && debug(`${name} schema created!`);
    return result;
  } catch (e) {
      error(JSON.stringify(e.stack));
      throw new Error(`Could not access the ${name} schema!`.red);
  }
};
module.exports = { getModel, getModuleLoggingMetaData };
