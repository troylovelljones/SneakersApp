'use strict';

const winston = require('winston');
const { createLogger, format, transports } = winston;
const { colorize, combine, label, ms, printf, timestamp, prettyPrint } = format;
const HOST_IP = require('../../core/server/utils/host-ip');
const colors = require('colors');
const env = require('dotenv').config();
const DEFAULT_PORT = 4080;
const loggers = new Map();
const suspendLogging = [];

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
      exceptionHandlers: [new transports.Console()]
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

const suspendLoggingMetaData = (fields = []) => {
  suspendLogging.push(...fields);
}

const resumeLoggingMetaData = () => {
  suspendLogging.length = 0;
}

module.exports = { create, loggers, resumeLoggingMetaData, suspendLoggingMetaData };
