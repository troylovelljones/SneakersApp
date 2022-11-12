'use strict';

require('colors');

const winston = require('winston');
const { createLogger, format, transports } = winston;
const { colorize, combine, label, ms, printf, timestamp, prettyPrint } = format;
const HOST_IP = require('../../core/server/utils/host-ip');

const loggers = new Map();
const suspendLogging = [];

//environment variables
const env = require('dotenv').config();
const DEFAULT_PORT = 4080;
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

/**
  * This function will color a log message
  * 
  * @author Troy Lovell Jones
  * @param {string} message The message to be logged.
  * @param {string} stack String representing the stack trace
  * @param {string} level Log level.
  * @returns {string} - Message wih color specifiers added
  * 
  */
function colorMessage (message, stack, level) {
  const error =
    Symbol.for(level) === Symbol.for('error'.red) ||
    Symbol.for(level) === Symbol.for('emerg'.red) ||
    Symbol.for(level) === Symbol.for('crit'.red) ||
    Symbol.for(level) === Symbol.for('alert'.red);
  
  const warn = Symbol.for(level) === Symbol.for('warn'.yellow); 
  //color the message in white if there is no error
  //if there is and error, message, and stack trace both message and stack trace return the stack trace and message colored in red 
  if (error && message && stack)
    return message.red + stack.red;
  //if there is anror, a message but no stack return the message colored in red  
  if (error && message && !stack) 
    return message.red; 
  //if there is an error and a message but no stack trace color the message in red
  if (error && !message && stack)
    return stack;
  return warn && message.yellow || message && message.white || ''; 
};

/**
  * This function will create a new logger and add to the indexed list of loggers
  *
  * @author Troy Lovell Jones
  * @param {string} moduleName The name of the module.
  * @param {object} options List of options that affect the formatting of the message
  * @returns {Map} - Map containing one or more loggers indexed by module
  * 
  */
function create (moduleName, options) {
  
  options = options || {};
  const formatModule = format((info, opts) => {
    //if moduleName is immutable, it keeps getting set to the orinal moduleName value
    if (info.immutable) {
      info.module = moduleName;
    }
    return info;
  });

  const logger = createLogger({
      level: options.level || 'info',
      format: combine(
        colorize(),
        label({ label: options.label || HOST_IP }),
        timestamp(),
        ms(),
        formatModule(),
        prettyPrint(),
        getFormatter(),
      ),
      defaultMeta: { module: moduleName, serverName: options.serverName },
      transports: [new transports.Console()],
      exceptionHandlers: [new transports.Console()],
      level: LOG_LEVEL.toLowerCase()
    });
  logger.add(new winston.transports.Http(getHttpLoggerConfig(options)))
  loggers.set(moduleName, logger);
  return loggers;
};

function getFormatter() { 
  return printf(function ({
      level,
      message,
      label,
      timestamp,
      stack,
      ms,
      module,
      ...metaData}) {
    return logFileRowFormat({
      level,
      message,
      label,
      timestamp,
      stack,
      ms,
      module,
      ...metaData
    });
  });
}

/**
  * This function will create a configuration for a Http Transport
  * 
  * @author Troy Lovell Jones
  * @param {object} options Http transport options
  * @returns {object} - Object containing the http transport configuration
  * 
  */
function getHttpLoggerConfig(options) {

  //host: (Default: localhost) Remote host of the HTTP logging endpoint
  //port: (Default: 80 or 443) Remote port of the HTTP logging endpoint
  //path: (Default: /) Remote URI of the HTTP logging endpoint
  //auth: (Default: None) An object representing the username and password for HTTP Basic Auth
  //ssl: (Default: false) Value indicating if we should use HTTPS
  //batch: (Default: false) Value indicating if batch mode should be used. A batch of logs to send through the HTTP request when one of the batch options is reached: number of elements, or timeout
  //batchInterval: (Default: 5000 ms) Value indicating the number of milliseconds to wait before sending the HTTP request
  //batchCount: (Default: 10) Value indicating the number of logs to cumulate before sending the HTTP request
  const path = options.path;
  return {path, format: winston.format.json(), port: options.port || DEFAULT_PORT};
}

/**
  * This function returns the formatted log message
  * 
  * @author Troy Lovell Jones
  * @param {string} level Log level
  * @param {string} message Log message
  * @param {string} label Tag which will appear as part of the log message
  * @param {string} timestamp Log timestamp
  * @param {string} ms Time since last log message
  * @param {string} module The node module where the log event occured
  * @param {object} metaData An object containing metaData that affects the log message
  * @returns {string} The formatted log message
  */
function logFileRowFormat({
  level,
  message,
  label,
  timestamp,
  stack,
  ms,
  module,
  ...metaData 
  }) {
  
  const hostIp = label;
  const clientIp = !suspendLogging.includes('clientIp') && metaData.clientIp || null;
  const serverName = !suspendLogging.includes('serverName') && metaData.serverName || null;
  const phase = !suspendLogging.includes('phase') && metaData.phase || null;
  const traceId = !suspendLogging.includes('traceId') && metaData.traceId || null;
  message = colorMessage(message, stack, level);

  const logFormat =
    `[`.white +
    `${ timestamp }`.blue +
    `]: `.white +
    `${ hostIp }: `.white +
    ((clientIp && `${ clientIp }: `.bold) || '') +
    ((phase && `${phase.toUpperCase()}: `.green.bold) || '') +
    `${ level }: ` +
    `${ serverName }: ` +
    `${module}: `.yellow.bold +
    ((traceId && `${ traceId }: `.red.bold) || '') +
    `${ message } ` +
    `${ ms }`.yellow;
  return logFormat;
}

/**
  * This function will prevent the supplied metadata from affecting the log
  * 
  * @author Troy Lovell Jones
  * @param {Array} fields A list of metadata properties that should be ignored
  * 
  */
const suspendLoggingMetaData = (fields = []) => {
  suspendLogging.push(...fields);
}

/**
  * This function will undo the behavior of {@link suspendLoggingMetaData}.
  * 
  * @author Troy Lovell Jones
  * 
  */
const resumeLoggingMetaData = () => {
  suspendLogging.length = 0;
}

module.exports = { create, loggers, resumeLoggingMetaData, suspendLoggingMetaData };
