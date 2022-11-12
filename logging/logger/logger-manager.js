"use strict";

//NOTE: nothing from app-services.js can be required in this module!!
//It will generate a circular dependency

const { create, loggers, suspendLoggingMetaData, resumeLoggingMetaData } = require('./logger');
const { getModuleName } = require('../../core/server/utils/extended-app-utils');
const { generateUniqueKey } = require('../../core/server/utils/extended-app-utils');
const { getRequestCount } = require('../../core/server/middleware/requestCounter');
const { resolve } = require('path');
const { throwError } = require('../../core/validation/validation');

const axios = require('axios');
const moduleName = getModuleName(module.filename);

const env = require('dotenv').config({path: require.main.path + '/.env'});
const BATCH_INTERVAL = process.env.BATCH_INTERVAL || 2000;
const HOST_IP = require('../../core/server/utils/host-ip');
const LOG_METRICS_URL = process.env.LOG_METRICS_URL || 'sneakers-logger-api/server/metrics';
const LOG_SERVER_PORT = process.env.LOG_SERVER_PORT || 4080;
const SERVER_ID = process.env.SERVER_ID;
const SERVER_NAME = process.env.SERVER_NAME;


let globalLogger;
let listenersAdded = false;

const moduleLoggerMetaData = {
  phase: 'startup',
}

//these metaData properties are read only
Object.defineProperty(moduleLoggerMetaData, 'moduleName', {
  module: moduleName,
  enumerable:true
});

Object.defineProperty(moduleLoggerMetaData, 'hostIp', {
  value: HOST_IP,
  enumerable:true
});

Object.defineProperty(moduleLoggerMetaData, 'serverName', {
  value: SERVER_NAME,
  enumerable:true
});
 
const moduleLogger = getNewLogger(moduleName, moduleLoggerMetaData);
const moduleQualityMap = new Map();  

//for debugging purposes
process.on('warning', e => console.warn(e.stack));

function createModuleLoggingMetaData(metaData) {
    return () => metaData;
};

/**
  * This function will suspend the logger from sending quality metrics
  * 
  * @author Troy Lovell Jones
  * @returns {undefined} undefined
  */
 const disableSendingQualityMetrics = (intervalId) => { clearInterval(intervalId) };

/**
  * This function will resume sending quality metrics from the logger
  * 
  * @author Troy Lovell Jones
  * @returns {number} An identifier which uniquely identify the process. This identifier is required to suspend sending metrics.
  */
 const enableSendingQualityMetrics = (accessToken) => { return setInterval(updateModuleQualityData, 
  BATCH_INTERVAL, { flushData: true}, accessToken) };

const getModuleLoggingMetaData = () => { return moduleLoggerMetaData };
global.getModuleLogginMetaData = getModuleLoggingMetaData;


/**
  * This function returns the global logger for the application.
  * 
  * @private
  * @author Troy Lovell Jones
  * @param {Object} metaDataCallback - metaData to be used for logging.
  * @param {boolean} trackModuleMetrics - flag which determines if server metrics are traced and logged.
  * @returns @type {Object}
  * @property {function} info function to log an informational message.
  * @property {function} error 
  * @property {function} warn unction to log a warning message.
  *
  * 
  */
function getGlobalLogger (metaDataCallback, trackModuleMetrics) {
  const mainModule = getModuleName(require.main.filename);
  const metaDataModule = metaDataCallback().module;
  try {
    !metaDataCallback && throwError('Callback cannot be null!');
    metaDataCallback && typeof metaDataCallback !== 'function' && throwError('Invalid parameter for metaDataCallback()');
    globalLogger = getLoggerFor(mainModule, metaDataCallback, trackModuleMetrics);
    !globalLogger && throwError(`Error creating logger for ${metaDataCallback().module}.`);
    logDebug(`Configuring a logger for ${mainModule} with ${metaDataModule}'s metadata`, metaDataCallback());
    logDebug(`Getting the logger for ${metaDataCallback().module}`)
    
    //<------default logger----->
    const log = (message, metaData) => {
      !message && logWarn('No message logged!');
      !globalLogger && throwError('Logger is null!'); 
      //format message such that object types print well as string 
      message = (typeof message === 'string' && message) || JSON.stringify(message, null, 2);
      //merge metaDataCallback() and metaData properties
      //metaData properties will override matching properties in metaDataCallback()
      metaData = {...metaDataCallback(), ...metaData };
      const level = metaData.level;
      switch (level) {
        case 'debug': globalLogger.debug(message, metaData); break;
        case 'error': globalLogger.error(message, metaData); break;
        case 'info': globalLogger.info(message, metaData); break;
        case 'warn': globalLogger.warn(message, metaData); break;
        default:  throwError('Invalid log level!');
      }
      return true;
      };
       
      /**
        * This function logs a debug message
        * 
        * @emits log-error
        * @param {string} message debug message
        * @param {Object} metaData information to be included with the log
        * @returns {boolean} returns true if the message is loggged
        */
      //<-----debug logger----->
      const debug = (message, metaData) => {
        metaData = metaData || metaDataCallback();
        log(message, { ...metaData, level:'debug' });
        return true;
      };

      /**
        * This function logs a warning message
        * 
        * @emits log-error
        * @param {string} message warning message
        * @param {Object} metaData information to be included with the log
        * @returns {boolean} returns true if the message is loggged
        */
      //<-----error logger----->
      const error = (message, metaData) => {
        metaData = metaData || metaDataCallback();
        globalLogger.emit('log-error', { module: metaData.module, newError: true, newWarning: false });
        log(message, {...metaData, level:'error', type: 'error'});
        return true;
      };

      /**
        * This function logs an informational message
        * 
        * @param {string} message warning message
        * @param {Object} metaData information to be included with the log
        * @returns {boolean} returns true if the message is loggged
        */
      //<-----info logger----->
      const info = (message, metaData) => {
        log(message, { ...metaData, level:'info',});
        return true;
      };

      /**
        * This function logs a warning
        * 
        * @emits log-warn
        * @param {string} message warning message
        * @param {Object} metaData information to be included with the log
        * @returns {boolean} returns true if the message is loggged
        */
      //<------warn logger----->
      const warn = (message, metaData) => {
   
        metaData = metaData || metaDataCallback();
        globalLogger.emit('log-warn', { module: metaData.module, newError: false, newWarning: true });
        log(message, {...metaData, level: 'warn'});
        return true;
      };
      
      return { debug, error, info, warn };
    
    } catch (e) {
        logError('Problem configuring the logger', moduleLoggerMetaData);
        logError(e, moduleLoggerMetaData);
        throw e;
    }
};

/**
  * This function returns the logger specific to the supplied module (moduleName).
  * @private
  * @author Troy Lovell Jones
  * @param {string} moduleName -The name of the module.
  * @param {Objecct} options - metaData to be used for logging. 
  * @param {boolean} trackModuleMetrics - flag which determines if server metrics are traced and logged.
  * @returns {undefined} undefined
  */
function getLoggerFor(moduleName, metaDataCallback, trackModuleMetrics) { 
  try {
    //log for the application modules
    const metaData = metaDataCallback();
    const logger = loggers.get(moduleName) || getNewLogger(moduleName, metaDataCallback, trackModuleMetrics);
    !logger && throwError(`ERROR: 33, Could not retrieve a logger for ${moduleName}`);
    logInfo(`SUCCESS: 31, Retreived a logger for ${moduleName} with options ${metaData && JSON.stringify(metaData)}`, moduleLoggerMetaData)
    return logger;
  } catch(e) {
      logError('There was a problem with getLoggerFor()', moduleLoggerMetaData)
      logError(e, moduleLoggerMetaData);
      e.stack && logError(e.stack, moduleLoggerMetaData);
      throw e;
  }
}

/**
  * This function retrieves a new logger from Winston.
  * @private
  * @author Troy Lovell Jones
  * @param {string} moduleName -The name of the module.
  * @param {Objecct} options - metaData to be used for logging.
  * @param {boolean} trackModuleMetrics - flag which determines if server metrics are traced and logged.
  * @returns {undefined} - undefined
  */
function getNewLogger(moduleName, options, trackModuleMetrics = true) {
  const logger = create(moduleName, options).get(moduleName);
  if (trackModuleMetrics && !listenersAdded) {
    logger.on('log-warn', data => { 
      logInfo('log-warn event recieved');
      updateModuleQualityData({ module: data.module, newWarning: true });
    });
    logger.on('log-error', data => { 
      logInfo('log-warn event recieved');
      updateModuleQualityData({ module: data.module, newError: true });
    });
    //no meta data has been assoicated with this logger yet so we use the default metaData defined in this module
    logger.info('Listeners added', moduleLoggerMetaData);
    listenersAdded = true;  
  }
  logger.info('New logger created.', moduleLoggerMetaData);
  return logger || throwError(`Could not create logger for ${moduleName}`);
}

/**
  * This function will log a debug message with the supplied string.
  * @private
  * @author Troy Lovell Jones
  * @param {string} message -The message to be logged.
  * @returns {boolean} - Returns true if the message was succesfully logged.
  * 
  */
 const logDebug = (message) => {
  message = (typeof message === 'string' && message) || JSON.stringify(message, null, 2);
  !moduleLogger || !moduleLoggerMetaData && throwError('Logger is null or metadata is null');
  moduleLogger.debug(message, moduleLoggerMetaData);
  return true
}

/**
  * This function will log a error with the supplied message.
  * @private
  * @author Troy Lovell Jones
  * @param {string} message -The message to be logged.
  * @returns {boolean} - Returns true if the message was succesfully logged.
  * 
  */
const logError = (message) => {
  message = (typeof message === 'string' && message) || JSON.stringify(message, null, 2);
  !moduleLogger || !moduleLoggerMetaData && throwError('Logger is null or metadata is null');
  moduleLogger.emit('log-error', {module: moduleName, newError: true, newWarnining: false})
  moduleLogger.error(message, moduleLoggerMetaData);
  return true
}

/**
  * This function will log a warning with the supplied message.
  * @private
  * @author Troy Lovell Jones
  * @param {string} message - The message to be logged
  * @returns {boolean} - Returns true if the message was logged
  */
const logWarning = (message) => {
  message = (typeof message === 'string' && message) || JSON.stringify(message, null, 2);
  !moduleLogger || !moduleLoggerMetaData && throwError('Logger is null or metadata is null');
  moduleLogger.emit('log-warn', {module: moduleName, newWarning: true, newError: false});
  moduleLogger.warn(message, moduleLoggerMetaData);
  return true;
}

/**
  * This function will log the supplied message.
  * @private
  * @author Troy Lovell Jones
  * @param {string} message -The message to be logged.
  * 
  */
const logInfo = (message) => {
  message = (typeof message === 'string' && message) || JSON.stringify(message, null, 2);
  !moduleLogger || !moduleLoggerMetaData && throwError('Logger is null or metadata is null');
  moduleLogger.info(message, moduleLoggerMetaData);
  return true;
}

/**
  * This function will send quality metrics to a remote logging server.
  * @async
  * @author Troy Lovell Jones
  * @param {number} serverId - The serverId corresponding to the curent server running logging.
  * @param {Object} accessToken The JWT access token assigned to the server.
  * 
  */
const sendQualityMetrics = async (accessToken, moduleQualityMetrics) => {

  logInfo('Sending Metrics.'.blue);
  const url = `http://${HOST_IP}:${LOG_SERVER_PORT}/${LOG_METRICS_URL}`;
  logInfo(`Sending metrics to endpoint = ${url}`);
  logInfo('Sending module quality metrics.', moduleLoggerMetaData);
  logInfo('Access token for sending quality metrics.');
  logInfo(accessToken);
  
  try {
    const data = { serverName: SERVER_NAME, ipAddress: HOST_IP, date: new Date(), moduleQualityMetrics, SERVER_ID };
    const header = setAuthHeader(accessToken);
    data.requestCount = getRequestCount();
    logInfo(data);
    logInfo('Sending request...');
    const response = await axios.post(url, data, header);
    logInfo(response.data);
    return response;
    
  } catch (e) {
      e && logError(e, moduleLoggerMetaData);
      e && logError(e.stack, moduleLoggerMetaData);
  }
}

/**
  * This function will set the authorization of an HTTP request.
  * Copied from appservices.js because of a circular dependency issue.
  * @private
  * @author Troy Lovell Jones
  * @param {Object} token - This is the JWT token required to access the service.
  * @returns {undefined} - undefined
  */
 const setAuthHeader = (token) => {
  moduleLogger.info('Setting authorization header.');
  return {
    headers: {
      Authorization: 'Bearer ' + token.jwt //the token is a variable which holds the token.
    }
  };
};

/**
  * This function starts a distrubuted trace.
  * Code copied from appservices.js because of a circular dependency issue.
  * @private
  * @author Troy Lovell Jones
  * @param {Object} module This mode module where the trace is being initated
  * @returns {number} - traceId, the id associated with the distributed trace
  */
const startTrace = (module) => {
  const traceId = generateUniqueKey();
  //Check to make sure there is a traceId and that it matches the current traceId
  module.traceId !== null && module.traceId !== module.traceId && logWarning('Trace already in progress.')
  module.traceId = traceId;
  updateModuleLoggingMetaData(module, { traceId });
  return module.traceId;
}

/**
  * This function stops a distrubuted trace.
  * Code copied from appservices.js because of a circular dependency issue.
  * @private
  * @author Troy Lovell Jones
  * @param {Object} module This mode module where the trace is being initated
  * @param {number} traceId traceId associated with the distrubuted trace
  * @returns {undefined} function does not return a value
  */
const stopTrace = (module, traceId) => {
  traceId !== module.traceId && throwError('Critical tracing error!');
  updateModuleLoggingMetaData(module, {traceId: null});
}

/**
  * This function synchonizes the logging metaData for modules passed as childModules.
  * 
  * @private
  * @author Troy Lovell Jones
  * @param {Array} childMOdules - array of modules to sync.
  * @param {Object} data = data that should be synchonizred across modules.
  * @param {Object} optonalMetaData - metadata that should be used by the logger to log the synchonization activity.
  * @returns {undefined} undefined
  */ 
const syncChildModules = (childModules, data, optionalMetaData) => {
  moduleLogger.warn(optionalMetaData, optionalMetaData);
  const metaData = optionalMetaData && { ...optionalMetaData } || null;
  try {
    //copying optionalMetaData do metaData so we don't change optionalMetaData
    metaData && metaData.module && delete metaData.module;
    for (let childModule of childModules) {
      const childModuleName = getModuleName(childModule);
      childModule = require(resolve(__dirname, childModule));
      if (!childModule.getModuleLoggingMetaData) {
        logWarning(`Module ${childModuleName} does not support logging, ${childModuleName}.getModuleLoggingMetaData() doesn't exist.`, metaData);
        continue;
      }
      logDebug(`Dependendency =  ${childModuleName}.`.white, metaData);
      logDebug(`${childModuleName} has logging enabled.`, metaData);
      for (const property in data) {
        logDebug(`Property = ${property}`.white, metaData);
        const value = data[property];
        logDebug(`${property} will be set to ${value}.`, metaData);
        childModule['getModuleLoggingMetaData']()[property] = value;
        logDebug(`${childModuleName}[${property}] equals ${value}`.white, metaData);
      }
    }
      return true;
    } catch (e) {
        logWarning('Logging properties did not sync.  This may cause logging messages to be incorrect.', metaData);
        logError(e.stack, metaData);
        return false;
    }
}

/**
  * This function synchonizes the logging metaData for modules passed as childModules.
  * 
  * @private
  * @author Troy Lovell Jones
  * @param {Array} childModules - array of modules to sync.
  * @param {Object} data data that should be synchonizred across modules.
  * @param {Object} optonalMetaData - metadata that should be used by the logger to log the synchonization activity.
  * @returns {undefined} undefined
  */ 
const updateParentModule = (parentModule, data, optionalMetaData) => {
  const metaData = optionalMetaData && { ...optionalMetaData } || null;
  try {
    //<--copy the metadata if optional metadata passed in-->
    
    //<---and remove the module info from the metadata-->
    metaData && metaData.module && delete metaData.module;
    const parentModuleName = getModuleName(parentModule.filename);
    for (const property in data) {
      logDebug(`Property = ${property}`, parentModule.getModuleLoggingMetaData());
      const value = data[property];
      logDebug(`${property} will be set to ${value}.`, parentModule.getModuleLoggingMetaData());
      parentModule.getModuleLoggingMetaData()[property] = value;
      logDebug(`${parentModuleName}[${property}] equals ${value}`, parentModule.getModuleLoggingMetaData());
    }

  } catch (e) {
      moduleLogger.warn('Parent module properties were not updated.  This may cause logging metadata to be incorrect.', parentModule.getModuleLoggingMetaData());
      logError(e, parentModule.getModuleLoggingMetaData());
      logError(e.stack, parentModule.getModuleLoggingMetaData());
      return false;
  }
}
 
/**
  * This function synchonizes the logging metaData for a module
  * 
  * @private
  * @author Troy Lovell Jones
  * @param {Object} module - node module.
  * @param {Object} data = data that should be synchonizred across modules.
  * @returns {undefined} undefined
  */ 
const updateModuleLoggingMetaData = (module, data) => {
    const fields = [];
    Object.keys(data).forEach((field) => fields.push(field));
    logInfo('winston-logging suspended for fields = '.red);
    logInfo(fields);
    suspendLoggingMetaData(fields);
    let updated = false;
    try {
      moduleLogger.info(`updateModuleLoggingMetaData() called with ${JSON.stringify(data,null, 2)}`, module.getModuleLoggingMetaData())
      if (!module || !module.getModuleLoggingMetaData) {
        moduleLogger.warn('Module was null or getModuleLoggingMetatData was null.  No dependencies synched!', module.getModuleLoggingMetaData());
        return updated;
      }

      logInfo(`Updating parent module ${module.filename}'s logging meta data`, module.getModuleLoggingMetaData());
      updateParentModule(module, data, module.getModuleLoggingMetaData());
      const dependencies = module.getDependencies();
      logInfo('Synching dependencies - winston.js'.cyan,  module.getModuleLoggingMetaData())
      logInfo(JSON.stringify(dependencies), module.getModuleLoggingMetaData());
      syncChildModules(dependencies, data, module.getModuleLoggingMetaData());
      updated = true;
      resumeLoggingMetaData();
      logInfo('winston-logging resumed'.red);
      return updated;
    } catch (e) {
        logError('updateModuleLoggingMetaData() failed', module.getModuleLoggingMetaData());
        logError(e.stack, module.getModuleLoggingMetaData());
        return updated;
    }
}

/**
  * This function synchonizes the logging metaData for a module
  * 
  * @author Troy Lovell Jones
  * @param  { {module: object, newError: boolean, newWarning: boolean}} metricsData
  * @param module Node module where the error or warnign occured
  * @param newError Boolean indicating that a new error occured in the module
  * @param newWarning Boolean indicating that a new warning occured in the module
  * @param {boolean} flushMetrics Boolean indicating whether metrics should be flushed from buffer and saved to an endpoint
  * @param {object} accessToken Access-token to use to authenticate with remote logging service
  */ 
const updateModuleQualityData = async ({module, newError, newWarning}, flushMetrics, accessToken) => {
  flushMetrics && logInfo('UMQD Access token = ') && logInfo(accessToken);
  const validParameters = () => {
    return (accessToken && flushMetrics && module) || module && !accessToken && !flushMetrics;
  }
  
  /**
    * This function flushes the buffer of saved metrics into an Array.
    * @author Troy Lovell Jones
    * @returns {Array<{module: string, errorCount: number, warningCount: number}>} An array of metric data for each node module with logging enabled
    */ 
  const flushMetricsFromBuffer = () => {
    const moduleQualityMetrics = [];
    for (const module of moduleQualityMap.keys()) {
      logInfo(`Getting module data for ${module}`);
      const metrics = moduleQualityMap.get(module);
      logInfo(`Getting metrics`);
      logInfo(metrics);
      moduleQualityMetrics.push(metrics);
      return moduleQualityMetrics;
    };
  }

  /**
    * This function logs the warnings and errors for each node module in the project
    * 
    * @author Troy Lovell Jones
    *
    */ 
  const logQualityMetrics = () => {
    !validParameters() && throwError('Invalid parameter, module cannot be null!');
    logInfo('Updating module quality.', moduleLoggerMetaData);
    let { errorCount, warningCount } = moduleQualityMap.get(module) || { errorCount: 0, warningCount: 0 };
    (newError && errorCount++) + (newWarning && warningCount++);
    logInfo(`Total errors = ${errorCount}`, moduleLoggerMetaData);
    logInfo(`Total warnings = ${warningCount}`, moduleLoggerMetaData);
    moduleQualityMap.set(module, { module, errorCount, warningCount });
  }

  try {

    !validParameters() && throwError('In order to flush the buffers an authenticaton token must be supplied');
    if (flushMetrics) {
      const moduleQualityMetrics = flushMetricsFromBuffer();
      await sendQualityMetrics(accessToken, moduleQualityMetrics) && moduleQualityMap.clear();
    } 
    else logQualityMetrics();
        return true;
    } catch (e) {
        logError('There was an error sending module quality data');
        e && logError(e);
        e.stack && logError(e.stack);
    }
}

/**
  * This function temporarily pauses program execution without blocking the main thread.
  * Copied from appservices.js because of a circular dependency issue.
  * @async
  * @author Troy Lovell Jones
  * @param {number} duration - the amount of time to pause.
  */ 
const waitFor = async (duration) => {
  moduleLogger.info('Waiting...', moduleLoggerMetaData);
  await new Promise((r) => setTimeout(r, duration));
};

module.exports = { 
  createModuleLoggingMetaData, 
  disableSendingQualityMetrics,
  enableSendingQualityMetrics,  
  getGlobalLogger, 
  getModuleLoggingMetaData,
  updateModuleLoggingMetaData 
}