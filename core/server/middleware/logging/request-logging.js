"use strict";

const { log, error, getModuleLoggingMetaData } = require('../../../../logging/logger/global-logger')(module);
const axios = require('axios');

const requestLogger = { requestCount: 0 };

const logRequest = (req, res, next) => {
    ++requestLogger.requestCount;
    next();

};

const updateRequestCount = () => {
    try {
        axios.post(reqUrl, requestLogger.requestCount);
    }
    catch (e) {
        error('There was an error updating the request count');
        error(JSON.stringify(e.stack, null, 2))
    }
}

setInterval(updateRequestCount, REQ_UPDATE_INTERVAL);




module.exports = logRequest;