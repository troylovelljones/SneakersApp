"use strict";

const HOST_IP_ADDRESS = require('../../core/server/utils/host-ip');
const { getModuleName } = require('../../core/server/utils/extended-app-utils');
const loggerManager = require('./logger-manager');
const SERVER_NAME = process.env.SERVER_NAME;

module.exports = (parentModule = module) => {
    const metaData = {};
    Object.defineProperty(metaData, "hostIp", {
        value: HOST_IP_ADDRESS
    });
    metaData.module = getModuleName(parentModule.filename);
    metaData.phase = 'startup';

    const getModuleLoggingMetaData = loggerManager.createModuleLoggingMetaData(metaData);
    return { getModuleLoggingMetaData, ...loggerManager.getGlobalLogger(getModuleLoggingMetaData)};
};

