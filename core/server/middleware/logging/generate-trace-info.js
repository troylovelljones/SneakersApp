'use strict';

const { generateUniqueKey } = require('../../utils/extended-app-utils');
const { info, getModuleLoggingMetaData } =
  require('../../../../logging/logger/global-logger')(module);


const generateTraceId = (req, res, next) => {
  getModuleLoggingMetaData.clientIp = null;
  const clientIp = req.ip.split('::ffff:')[1];
  info(`Client id = ${clientIp}`);
  getModuleLoggingMetaData.clientIp = clientIp;
  req.traceId = !req.body.traceId ? info('Generating trace id') && generateUniqueKey() : req.body.traceId;
  info(`Trace id = ${req.traceId}`);
  next();
};


module.exports = generateTraceId;
