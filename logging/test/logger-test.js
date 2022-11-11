'use strict';

//const log = require('./global-logger');
/*const log = require('./global-logger');
const moduleLoggingMetaData = {
    phase: 'startup',
    module: 'Dallas'
  };

//log('Hello Dolly');
log('Hello Dolly');

const metaData = { logFormat: 'phases', phase: 'ready', immutable: false };
log('Hello world', 'info', metaData, metaData, metaData);
metaData.traceId = 100;
metaData.clientIp = 999;
metaData.module = 'Miami';
log('Hello world again.', metaData);
metaData.module = 'New York';
log('Hello world again.', metaData, {module: 'Fred'}, {module: 'Tim'});
metaData.module = 'San Francisco';
log('Hello world, but this time stil in San Fran.', metaData);*/

const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'user-service' },
  transports: [
    //
    // - Write all logs with importance level of `error` or less to `error.log`
    // - Write all logs with importance level of `info` or less to `combined.log`
    //
  
    new winston.transports.Http({path: '/sneaker-logger-api/server/logs', format: winston.format.json()}),
    new winston.transports.Console({format: winston.format.simple()}),

  ],
});

logger.info('Hello world');
/*
logger('Hello world');

logger('Hello world', metaData);
metaData.traceId = 100;
metaData.clientIp = 999;
metaData.module = 'Miami';
logger('Hello world again.', metaData);
metaData.module = 'New York';
logger('Hello world again.', metaData);
metaData.immutable = true;
metaData.module = 'San Francisco';
logger('Hello world, but this time stil in New York.', metaData);*/
