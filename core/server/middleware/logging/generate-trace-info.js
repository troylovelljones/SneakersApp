'use strict';

const { generateUniqueKey } = require('../../utils/extended-app-utils');
const { log, getModuleLoggingMetaData } =
  require('../../../../logging/logger/global-logger')(module);


const generateTraceId = (req, res, next) => {
  getModuleLoggingMetaData.clientIp = null;
  const clientIp = req.ip.split('::ffff:')[1];
  log(clientIp);
  getModuleLoggingMetaData.clientIp = clientIp;
  req.traceId = !req.body.traceId ? log('Generating trace id') && generateUniqueKey() : req.body.traceId;
  log(`Trace id = ${req.traceId}`);
  next();
};


module.exports = generateTraceId;
