"use strict"

const { resolve } = require('path');
const { throwError } = require('../../core/validation/validation');
const env = require('dotenv').config();
const HOST_IP = require('../../core/server/utils/host-ip');
const { getModuleName } = require('../../core/server/utils/extended-app-utils');
const { create, loggers, suspendLoggingMetaData, resumeLoggingMetaData } = require('./logger');
const { logger } = require('express-winston');
const loggerManagerModule = getModuleName(module.filename);

const getNewLogger = (moduleName, metaDataCallback) => {
  const logger = create(moduleName, metaDataCallback).get(moduleName);
  return logger || throwError(`Could not create logger for ${moduleName}`);
}

const getMetaData = createModuleLoggingMetaData({
    module: getModuleName(module.filename),
    phase: 'startup',
    hostIp: 12.12,
});
  
function getLoggerFor(moduleName, metaDataCallback) { 
    try {
      const logger = loggers.get(loggerManagerModule) || getNewLogger(loggerManagerModule, getMetaData);
      const appLogger = loggers.get(moduleName) || getNewLogger(moduleName, metaDataCallback);
      appLogger ? logger.info(`SUCCESS: 30, Retreived a new logger for ${moduleName}`) && logger.info(` with options ${ metaDataCallback && JSON.stringify(metaDataCallback())}`) :
        logger.error('There was a problem with getLoggerFor()');
      if (!appLogger) throwError(`ERROR: 31, Could not retrieve a logger for ${moduleName}`);
      return appLogger;
    } catch(e) {
      console.log(e);
      throw e;
    }
}


function createModuleLoggingMetaData(metaData) {
    return () => metaData;
};
  
function getGlobalLogger (metaDataCallback) {
  const mainModule = getModuleName(require.main.filename);
  const metaDataModule = metaDataCallback().module;
  const logger = loggers.get(loggerManagerModule) || getNewLogger(loggerManagerModule, getMetaData)
  try {
      !metaDataCallback && throwError('Callback cannot be null!');
      const globalLogger = getLoggerFor(mainModule, metaDataCallback);
      !globalLogger && throwError(`Error creating logger for ${metaDataCallback().module}.`)
      logger.info(`Configuring a logger for ${mainModule} with ${metaDataModule}'s metadata`, metaDataCallback());
    
      //<------log logger----->
      const log = (message, metaData) => {
        !message && logger.warn('No message logged!');
        !globalLogger && throwError('Logger is null!'); 
          metaData = metaData || metaDataCallback();
        const level = metaData.level || 'info';
          switch (level) {
            case 'info': globalLogger.info(message, metaData); break;
            case 'error': globalLogger.error(message, metaData); break;
            case 'warn': globalLogger.warn(message, metaData);break;
            default: console.log('Nothing was logged!');break;
          }
        return true;
      };
      //<-----error logger----->
      const error = (message, metaData) => {
        metaData = metaData || metaDataCallback()
        log(message, {level:'error', ...metaData});
        return true;
      }; 
      //<------warn logger----->
      const warn = (message, metaData) => {
        metaData = metaData || metaDataCallback()
        log(message, {level: 'warn', ...metaData});
        return true;
      };
      log('Logger functioning properly');
      return { error, log, warn };
    } catch (e) {
      logger.error('Problem configuring the logger');
      throw e;
    }
};

const syncChildModules = (childModules, data, optionalMetaData) => {
  const logger = loggers.get(loggerManagerModule) || getNewLogger(loggerManagerModule, getMetaData);  
  try {
    const metaData = optionalMetaData && { ...optionalMetaData } || null;
    metaData && metaData.module && delete metaData.module;
    for (let childModule of childModules) {
      const childModuleName = getModuleName(childModule);
      childModule = require(resolve(__dirname, childModule));
      if (!childModule.getModuleLoggingMetaData) {
        logger.warn(`Module ${childModuleName} does not support logging, ${childModuleName}.getModuleLoggingMetaData() doesn't exist.`, metaData);
        continue;
      }
      logger.info(`Dependendency =  ${childModuleName}.`, metaData);
      logger.info(`${childModuleName} has logging enabled.`, metaData);
      for (const property in data) {
        logger.info(`Property = ${property}`);
        const value = data[property];
        logger.info(`${property} will be set to ${value}.`, metaData);
        childModule['getModuleLoggingMetaData']()[property] = value;
        logger.info(`${childModuleName}[${property}] equals ${value}`, metaData);
      }
    }
      return true;
    } catch (e) {
        logger.warn('Logging properties did not sync.  This may cause logging messages to be incorrect.');
        logger.error(e.stack);
        return false;
    }
}

const updateParentModule = (parentModule, data, optionalMetaData) => {
  const logger = loggers.get(loggerManagerModule) || getNewLogger(loggerManagerModule, getMetaData);
  try {
    //<--copy the metadata if optional metadata passed in-->
    const metaData = optionalMetaData && { ...optionalMetaData } || null;
    //<---and remove the module info from the metadata-->
    metaData && metaData.module && delete metaData.module;
    const parentModuleName = parentModule.filename;
    for (const property in data) {
      logger.info(`Property = ${property}`);
      const value = data[property];
      logger.info(`${property} will be set to ${value}.`, metaData);
      parentModule.getModuleLoggingMetaData()[property] = value;
      logger.info(`${parentModuleName}[${property}] equals ${value}`, metaData);
    }

  } catch (e) {
      logger.warn('Parent module properties were not updated.  This may cause logging metadata to be incorrect.');
      logger.error(e);
      logger.error(e.stack);
      return false;
  }
}
  
const updateModuleLoggingMetaData = (module, data) => {
    const fields = [];
    Object.keys(data).forEach((field) => fields.push(field));
    suspendLoggingMetaData(fields);
    let updated = false;
    const logger = loggers.get(loggerManagerModule) || getNewLogger(loggerManagerModule, getMetaData);
    try {
      logger.info('updateModuleLoggingMetaData() called.')
      if (!module || !module.getModuleLoggingMetaData) {
        logger.warn('Module was null or getModuleLoggingMetatData was null.  No dependencies synched!');
        return updated;
      }

      logger.info(`Updating parent module ${module.filename}'s logging meta data`);
      updateParentModule(module, data, module.getModuleLoggingMetaData());
      const dependencies = module.getDependencies();
      logger.info('Synching dependencies.')
      logger.info(JSON.stringify(dependencies));
      syncChildModules(dependencies, data, module.getModuleLoggingMetaData());
      updated = true;
      resumeLoggingMetaData();
      return updated;
    } catch (e) {
        logger.error('updateModuleLoggingMetaData() falied');
        logger.error(e.stack);
        return updated;
    }
}

module.exports = { createModuleLoggingMetaData, getGlobalLogger, updateModuleLoggingMetaData }