"use strict";

const env = require('dotenv').config({path: require.main.path + '/.env'});
const { createModuleLoggingMetaData, getGlobalLogger } = require('./logger-manager');
const { getModuleName } = require('../../core/server/utils/extended-app-utils');
const HOST_IP_ADDRESS = require('../../core/server/utils/host-ip');
const { throwError } = require('../../core/validation/validation');
const LOG_ENTRIES_URL = process.env.LOG_ENTRIES_URL  || '/sneakers-logger-api/server/logs';
const SERVER_NAME = process.env.SERVER_NAME;

module.exports = (parentModule = module) => {
    const metaData = {};
    //define read-only properties
    Object.defineProperty(metaData, 'hostIp', {
        value: HOST_IP_ADDRESS,
        enumerable:true
    });
    Object.defineProperty(metaData, 'serverName', {
        value: SERVER_NAME,
        enumerable:true
    });
    metaData.module = getModuleName(parentModule.filename);
    metaData.phase = 'startup';
    metaData.path = LOG_ENTRIES_URL; 

    const getModuleLoggingMetaData = createModuleLoggingMetaData(metaData);
    return { getModuleLoggingMetaData, ...getGlobalLogger(getModuleLoggingMetaData, true)};
};

