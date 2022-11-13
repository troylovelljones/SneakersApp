'use strict';

const { generateUniqueKey } = require('../../utils/extended-app-utils');
const { debug, getModuleLoggingMetaData } =
  require('../../../../logging/logger/global-logger')(module);


const generateTraceId = (req, res, next) => {
  getModuleLoggingMetaData.clientIp = null;
  const clientIp = req.ip.split('::ffff:')[1];
  debug(`Client id = ${clientIp}`);
  getModuleLoggingMetaData.clientIp = clientIp;
  req.traceId = !req.body.traceId ? debug('Generating trace id') && generateUniqueKey() : req.body.traceId;
  debug(`Trace id = ${req.traceId}`);
  next();
};


module.exports = generateTraceId;
